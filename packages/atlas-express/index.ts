import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import type { Scope } from "@effect-ts/core/Effect/Scope"
import { pipe } from "@effect-ts/core/Function"
import type { Has } from "@effect-ts/core/Has"
import { tag } from "@effect-ts/core/Has"
import type { _A } from "@effect-ts/core/Utils"
import express from "express"
import type * as http from "http"
import { match } from "node-match-path"

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD"
  | "TRACE"

export class ExpressCloseError {
  readonly _tag = "ExpressCloseError"
  constructor(readonly error: Error) {}
}

export class ExpressListenError {
  readonly _tag = "ExpressCloseError"
  constructor(readonly error: Error) {}
}

export interface ExpressConfig {
  readonly host: string
  readonly port: number
}

export const ExpressConfig = tag<ExpressConfig>()

export const LiveExpressConfig = L.fromEffect(ExpressConfig)(
  T.succeed({ port: 5000, host: "0.0.0.0" })
)

export const makeExpress = M.gen(function* (_) {
  const expressApp = yield* _(T.succeedWith(() => express()))
  const { host, port } = yield* _(ExpressConfig)
  const nodeServer = yield* _(
    pipe(
      T.effectAsync<unknown, never, http.Server>((cb) => {
        const onError = (err: Error): void => {
          cb(T.die(new ExpressListenError(err)))
        }
        const s = expressApp
          .listen(port, host, () => {
            cb(
              T.succeedWith(() => {
                s.removeListener("error", onError)
                console.log("Listening")
                return s
              })
            )
          })
          .once("error", onError)
      }),
      M.makeExit((s) =>
        T.effectAsync((cb) => {
          s.close((err) => {
            if (err) {
              cb(T.die(new ExpressCloseError(err)))
            } else {
              cb(
                T.succeedWith(() => {
                  console.log("Closed")
                })
              )
            }
          })
        })
      )
    )
  )

  return {
    expressApp,
    nodeServer
  }
})

export interface ExpressService extends Readonly<_A<typeof makeExpress>> {}

export const ExpressService = tag<ExpressService>()

export const expressApp = T.accessService(ExpressService)((exp) => exp.expressApp)

export const nodeServer = T.accessService(ExpressService)((exp) => exp.nodeServer)

export const LiveExpress = L.fromManaged(ExpressService)(makeExpress)

export class RequestContextImpl {
  readonly _tag = "RequestContext"
  constructor(
    readonly req: express.Request,
    readonly res: express.Response,
    readonly next: express.NextFunction
  ) {}
}

export interface RequestContext extends RequestContextImpl {}

export const RequestContext = tag<RequestContext>()

export const makeRouter = M.gen(function* (_) {
  const table: Record<
    string,
    Partial<Record<HttpMethod, T.RIO<Has<RequestContext>, void>[]>>
  > = yield* _(T.succeedWith(() => ({})))

  const { expressApp } = yield* _(ExpressService)
  const scope = yield* _(T.forkScope)

  yield* _(
    T.succeedWith(() => {
      expressApp.use(
        express.json(),
        express.urlencoded({ extended: true }),
        express.raw(),
        (req, res, next) => {
          const method = (req.method.toUpperCase() as any) as HttpMethod
          const path = req.path
          if (table[path] && table[path][method]) {
            unsafeRouterProcess(scope, req, res, next, table, path, method)
          } else {
            let cont = true

            for (const p of Object.keys(table).sort((x, y) => y.length - x.length)) {
              if (table[p][method]) {
                const matched = match(p, path)
                if (matched.matches) {
                  cont = false
                  req.params = matched.params
                  unsafeRouterProcess(scope, req, res, next, table, p, method)
                  break
                }
              }
            }
            if (cont) {
              next()
            }
          }
        }
      )
    })
  )

  return {
    addRoute: <R>(
      method: HttpMethod,
      path: string,
      handler: T.RIO<Has<RequestContext> & R, void>
    ) =>
      T.accessM((r: R) =>
        T.succeedWith(() => {
          if (!table[path]) {
            table[path] = {}
          }
          if (!table[path][method]) {
            table[path][method] = []
          }

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          table[path][method]!.push(T.provide(r)(handler))
        })
      )
  }
})

export interface Router extends _A<typeof makeRouter> {}
export const Router = tag<Router>()
export const LiveRouter = L.fromManaged(Router)(makeRouter)

function unsafeRouterProcess(
  scope: Scope<any>,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
  table: Record<
    string,
    Partial<Record<HttpMethod, T.RIO<Has<RequestContext>, void>[]>>
  >,
  path: string,
  method: HttpMethod
) {
  T.run(
    T.forkIn(scope)(
      pipe(
        T.provideService(RequestContext)(new RequestContextImpl(req, res, next))(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          T.collectAllUnit(table[path][method]!)
        ),
        T.catchAllCause((cause) =>
          T.succeedWith(() => {
            res.status(500).send(cause)
          })
        )
      )
    )
  )
}
