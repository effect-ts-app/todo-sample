import { RequestContext, Router } from "@atlas-ts/express"
import * as T from "@effect-ts/core/Effect"
import * as M from "@effect-ts/core/Effect/Managed"
import { pipe } from "@effect-ts/core/Function"
import type { Has } from "@effect-ts/core/Has"
import type { Erase, UnionToIntersection } from "@effect-ts/core/Utils"
import type * as MO from "@effect-ts/morphic"
import * as D from "@effect-ts/morphic/Decoder"
import * as E from "@effect-ts/morphic/Encoder"
import redoc from "redoc-express"

import type { MalformedRequestError } from "../Errors"
import { malformedRequestError } from "../Errors"
import type { GeneralInfo } from "../Gen"
import { generate, generateMerged } from "../Gen"
import type {
  AnyOperation,
  AnyPath,
  Api,
  BodyEnv,
  Methods,
  Operation,
  RequestBody,
  Type
} from "../Spec"

export type OpResponses<O> = [O] extends [{ responses: any }] ? O["responses"] : never

export type OpParameters<O> = [O] extends [{ parameters: any }]
  ? O["parameters"]
  : never

export type OpParametersBody<O, P extends PropertyKey, L extends PropertyKey> = [
  O
] extends [
  {
    parameters: {
      [p in P]: { [l in L]: { content: Type<any, any>; required?: boolean } }
    }
  }
]
  ? O["parameters"][P][L]["required"] extends true
    ? O["parameters"][P][L]["content"]["_A"]
    : O["parameters"][P][L]["content"]["_A"] | undefined
  : never

export type OpResponseBody<O, K extends PropertyKey> = K extends 400
  ? MalformedRequestError
  : [O] extends [{ responses: { [k in K]: { content: Type<any, any> } } }]
  ? O["responses"][K]["content"]["_A"]
  : never

export type DSL<O extends Operation<any, any, any, any, any>> = {
  operation: O
  respond: <K extends keyof OpResponses<O> | "400">(
    code: K,
    body: OpResponseBody<O, K>
  ) => T.UIO<void>
  parameters: {
    [p in keyof OpParameters<O>]: {
      [l in keyof OpParameters<O>[p]]: OpParametersBody<O, p, l>
    }
  }
} & ([O] extends [{ requestBody: RequestBody<any, any, any> }]
  ? {
      requestBody: O["requestBody"]["required"] extends true
        ? O["requestBody"]["content"] extends T.Effect<
            infer _R,
            infer _E,
            MO.M<infer _R2, infer _E2, infer A>
          >
          ? A
          : never
        :
            | (O["requestBody"]["content"] extends T.Effect<
                infer _R,
                infer _E,
                MO.M<infer _R2, infer _E2, infer A>
              >
                ? A
                : never)
            | undefined
    }
  : {})

export interface HandlerFunction<O extends Operation<any, any, any, any, any>, R> {
  (_: DSL<O>): T.RIO<R, void>
}

export type Server<A extends Api<any, any>> = UnionToIntersection<
  {
    [k in keyof A["paths"] & string]: A["paths"][k] extends AnyPath
      ? {
          [h in keyof A["paths"][k]["methods"] &
            string as `[${h}]: ${k}`]: HandlerFunction<A["paths"][k]["methods"][h], any>
        }
      : never
  }[keyof A["paths"] & string]
>

export type ServerCreator<A extends Api<any, any>> = <I extends Server<A>>(
  _: I
) => M.RIO<
  Erase<
    UnionToIntersection<
      {
        [k in keyof I]: [I[k]] extends [HandlerFunction<any, infer R>]
          ? unknown extends R
            ? never
            : R
          : never
      }[keyof I]
    >,
    Has<RequestContext>
  > &
    Has<Router> &
    BodyEnv<A>,
  ServerInstance<A>
>

export class ServerInstance<A extends Api<any, any>> {
  readonly _tag = "ServerInstance"
  constructor(readonly api: A) {}
}

export function setupApiDoc<A extends Api<any, any>>(
  api: A,
  config: { docsUrl: string; jsonUrl: string }
) {
  return T.gen(function* (_) {
    const { addRoute } = yield* _(Router)
    const spec = yield* _(generate(api))
    const jsonSpec = yield* _(T.effectTotal(() => JSON.stringify(spec, null, 2)))

    yield* _(
      addRoute(
        "GET",
        config.docsUrl,
        T.accessServiceM(RequestContext)(({ next, req, res }) =>
          T.effectTotal(() => {
            redoc({
              title: api.info.pageTitle,
              specUrl: config.jsonUrl
            })(req, res, next)
          })
        )
      )
    )

    yield* _(
      addRoute(
        "GET",
        config.jsonUrl,
        T.accessServiceM(RequestContext)(({ res }) =>
          T.effectTotal(() => {
            res.set({
              "Content-Disposition": 'attachment; filename="openapi.json"',
              "Content-Type": "text/plain",
              "Content-Length": jsonSpec.length
            })
            res.send(spec)
          })
        )
      )
    )
  })
}

export function setupMergedApiDoc(
  info: GeneralInfo,
  config: { docsUrl: string; jsonUrl: string }
) {
  return <Apis extends readonly Api<any, any>[]>(...specs: Apis) =>
    T.gen(function* (_) {
      const { addRoute } = yield* _(Router)
      const spec = yield* _(generateMerged(info)(...specs))
      const jsonSpec = yield* _(T.effectTotal(() => JSON.stringify(spec, null, 2)))

      yield* _(
        addRoute(
          "GET",
          config.docsUrl,
          T.accessServiceM(RequestContext)(({ next, req, res }) =>
            T.effectTotal(() => {
              redoc({
                title: info.pageTitle,
                specUrl: config.jsonUrl
              })(req, res, next)
            })
          )
        )
      )

      yield* _(
        addRoute(
          "GET",
          config.jsonUrl,
          T.accessServiceM(RequestContext)(({ res }) =>
            T.effectTotal(() => {
              res.set({
                "Content-Disposition": 'attachment; filename="openapi.json"',
                "Content-Type": "text/plain",
                "Content-Length": jsonSpec.length
              })
              res.send(spec)
            })
          )
        )
      )

      return {
        spec
      }
    })
}

export function server<A extends Api<any, any>>(api: A): ServerCreator<A> {
  return (impl: Server<A>) => {
    return M.gen(function* (_) {
      const { addRoute } = yield* _(Router)
      const handlers = impl as Record<string, any>
      for (const k of Object.keys(handlers)) {
        const op = /\[(.*)\]: (.*)/.exec(k)
        if (op) {
          const [, method, path] = op
          const components = path.split("/")
          const m: Methods = method as Methods
          const expressPath =
            (api.info.prefix || "") +
            components
              .map((c) => {
                const param = /{(.*)}/.exec(c)
                if (param) {
                  return `:${param[1]}`
                }
                return c
              })
              .join("/")

          const env = yield* _(T.environment())

          const fn: HandlerFunction<any, any> = handlers[k]
          const operation: AnyOperation<any> = api.paths[path]["methods"][method]

          yield* _(
            addRoute(
              m,
              expressPath,
              pipe(
                T.gen(function* (_) {
                  const { req: _req, res: _res } = yield* _(RequestContext)
                  const headers: Record<string, any> = {}
                  const pathParams: Record<string, any> = {}
                  const queryParams: Record<string, any> = {}
                  if (operation["parameters"] && operation["parameters"]["header"]) {
                    const headerParams = operation["parameters"]["header"]
                    for (const hp of Object.keys(headerParams)) {
                      const header = _req.header(hp)
                      if (headerParams[hp]["required"] === true && !header) {
                        yield* _(
                          T.fail(
                            malformedRequestError(
                              `The following header is missing ${hp}`
                            )
                          )
                        )
                      } else {
                        if (header) {
                          const decoded = yield* _(
                            pipe(
                              D.decode(headerParams[hp]["content"])(header),
                              D.report,
                              T.catchAll((e) =>
                                T.fail(
                                  malformedRequestError(
                                    `The following header is malformed: ${hp} (${e.join(
                                      ", "
                                    )})`
                                  )
                                )
                              )
                            )
                          )
                          headers[hp] = decoded
                        }
                      }
                    }
                  }
                  if (operation["parameters"] && operation["parameters"]["path"]) {
                    const params = operation["parameters"]["path"]
                    for (const pp of Object.keys(params)) {
                      const param = _req.params[pp]
                      if (params[pp]["required"] === true && !param) {
                        yield* _(
                          T.fail(
                            malformedRequestError(
                              `The following path parameter is missing ${pp}`
                            )
                          )
                        )
                      } else {
                        if (param) {
                          const decoded = yield* _(
                            pipe(
                              D.decode(params[pp]["content"])(param),
                              D.report,
                              T.catchAll((e) =>
                                T.fail(
                                  malformedRequestError(
                                    `The following path parameter is malformed: ${pp} (${e.join(
                                      ", "
                                    )})`
                                  )
                                )
                              )
                            )
                          )
                          pathParams[pp] = decoded
                        }
                      }
                    }
                  }
                  if (operation["parameters"] && operation["parameters"]["query"]) {
                    const params = operation["parameters"]["query"]
                    for (const pp of Object.keys(params)) {
                      const param = _req.query[pp]
                      if (params[pp]["required"] === true && !param) {
                        yield* _(
                          T.fail(
                            malformedRequestError(
                              `The following query parameter is missing ${pp}`
                            )
                          )
                        )
                      } else {
                        if (param) {
                          const decoded = yield* _(
                            pipe(
                              D.decode(params[pp]["content"])(param),
                              D.report,
                              T.catchAll((e) =>
                                T.fail(
                                  malformedRequestError(
                                    `The following query parameter is malformed: ${pp} (${e.join(
                                      ", "
                                    )})`
                                  )
                                )
                              )
                            )
                          )
                          queryParams[pp] = decoded
                        }
                      }
                    }
                  }
                  let requestBody = undefined
                  if (operation["requestBody"]) {
                    const body = _req.body
                    if (operation["requestBody"]["required"] === true && !body) {
                      yield* _(
                        T.fail(
                          malformedRequestError(`The body of the request is missing`)
                        )
                      )
                    } else {
                      requestBody = yield* _(
                        pipe(
                          D.decode(
                            yield* _(<T.UIO<any>>operation["requestBody"]["content"])
                          )(body),
                          D.report,
                          T.catchAll((e) =>
                            T.fail(
                              malformedRequestError(
                                `The body of the request is malformed: (${e.join(
                                  ", "
                                )})`
                              )
                            )
                          )
                        )
                      )
                    }
                  }
                  yield* _(
                    fn({
                      operation,
                      respond: (code, body) =>
                        pipe(
                          E.encode(operation["responses"][code]["content"])(body),
                          T.chain((b) =>
                            T.effectTotal(() => {
                              _res.status(parseInt(code as string)).send(b)
                            })
                          )
                        ),
                      parameters: {
                        header: headers,
                        path: pathParams,
                        query: queryParams
                      },
                      requestBody: requestBody as any
                    })
                  )
                }),
                T.catchAll((e) =>
                  T.accessServiceM(RequestContext)(({ res }) =>
                    T.effectTotal(() => {
                      res.status(400).send(e)
                    })
                  )
                ),
                T.provide(env)
              )
            )
          )
        }
      }

      return new ServerInstance(api)
    })
  }
}

export type HandlerSpec<X extends Api<any, any>> = {
  [k in keyof Server<X>]?: Server<X>[k]
}

export type Handler<A extends Api<any, any>, PM extends keyof Server<A>, R> = {
  [k in PM]: (
    _: Server<A>[PM] extends HandlerFunction<any, any>
      ? Parameters<Server<A>[PM]>[0]
      : never
  ) => T.RIO<R, void>
}

export type Supported<S> = {
  [k in keyof S]: S[k] extends HandlerFunction<any, any> ? k : never
}[keyof S]

export type HandlerCreator<X extends Api<any, any>> = <PM extends Supported<Server<X>>>(
  pm: PM
) => <R>(I: Handler<X, PM, R>[PM]) => Handler<X, PM, R>

export function handler<X extends Api<any, any>>(_spec: X): HandlerCreator<X> {
  return (pm) => (I) => ({ [pm]: I } as any)
}
