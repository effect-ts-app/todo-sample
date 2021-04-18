import { JSONSchema, SubSchema } from "@atlas-ts/plutus/JsonSchema"
import { schema } from "@atlas-ts/plutus/Schema"
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import { Void } from "@effect-ts-demo/todo-types/shared"
import { pipe } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"
import * as Ex from "@effect-ts/express"
import { M } from "@effect-ts/morphic"

import { makeRequestHandler, RequestHandler } from "@/requestHandler"

type Request<ReqA> = M<{}, unknown, ReqA> & {
  Path?: M<{}, any, any>
  Body?: M<{}, any, any>
}
type Methods = "GET" | "PUT" | "POST" | "PATCH" | "DELETE"
export interface RouteDescriptor<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends Request<ReqA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResA>,
  R,
  ReqA,
  ResA,
  METHOD extends Methods
> {
  path: string
  method: METHOD
  handler: RequestHandler<Req, Res, R, ReqA, ResA>
}

export function makeRouteDescriptor<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends Request<ReqA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResA>,
  R,
  ReqA,
  ResA,
  METHOD extends Methods
>(path: string, method: METHOD, handler: RequestHandler<Req, Res, R, ReqA, ResA>) {
  return { path, method, handler } as RouteDescriptor<Req, Res, R, ReqA, ResA, METHOD>
}

export function get<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends Request<ReqA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResA>,
  R,
  ReqA,
  ResA
>(path: string, r: RequestHandler<Req, Res, R, ReqA, ResA>) {
  return pipe(
    Ex.get(path, makeRequestHandler(r)),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "GET", r)))
  )
}

export function post<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends Request<ReqA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResA>,
  R,
  ReqA,
  ResA
>(path: string, r: RequestHandler<Req, Res, R, ReqA, ResA>) {
  return pipe(
    Ex.post(path, makeRequestHandler(r)),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "POST", r)))
  )
}

export function put<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends Request<ReqA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResA>,
  R,
  ReqA,
  ResA
>(path: string, r: RequestHandler<Req, Res, R, ReqA, ResA>) {
  return pipe(
    Ex.put(path, makeRequestHandler(r)),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "PUT", r)))
  )
}

export function patch<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends Request<ReqA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResA>,
  R,
  ReqA,
  ResA
>(path: string, r: RequestHandler<Req, Res, R, ReqA, ResA>) {
  return pipe(
    Ex.patch(path, makeRequestHandler(r)),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "PATCH", r)))
  )
}

function del<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends Request<ReqA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResA>,
  R,
  ReqA,
  ResA
>(path: string, r: RequestHandler<Req, Res, R, ReqA, ResA>) {
  return pipe(
    Ex.delete(path, makeRequestHandler(r)),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "DELETE", r)))
  )
}
export { del as delete }
/**
 * Work in progress JSONSchema generator.
 */
export function makeSchema(r: A.Array<RouteDescriptor<any, any, any, any, any, any>>) {
  return pipe(
    T.forEach_(r, (e) => {
      const { Request: Req, Response: Res } = e.handler
      // TODO: use the path vs body etc serialisation also in the Client.
      // we can also use them to separately deserialise Path, Query, Body, Headers.
      const makeReqPathSchema = EO.fromNullable(Req.Path)["|>"](EO.chainEffect(schema))
      const makeReqBodySchema = EO.fromNullable(Req.Body)["|>"](EO.chainEffect(schema))
      //const makeReqSchema = schema(Req)
      const makeResSchema = schema(Res)

      // TODO: Split between route params, body/query params: `parameters` `in` path, query, header
      // TODO: custom void type - 204 response
      // https://github.com/Effect-TS/morphic/commit/da3a02fb527089807bcd5253652ee5a5b1efa371

      return pipe(
        T.struct({
          //req: makeReqSchema,
          reqBody: makeReqBodySchema,
          reqPath: makeReqPathSchema,
          res: makeResSchema,
        }),
        T.map((_) => ({
          path: e.path,
          method: e.method,
          parameters: O.toUndefined(_.reqPath), // TODO: "in path"  "in query" "in headers"
          requestBody: O.toUndefined(_.reqBody),
          responses: A.concat_(
            [
              e.handler.Response === Void
                ? new Response(204, "Empty")
                : new Response(200, _.res),
              new Response(400, "ValidationError"),
            ],
            e.path.includes(":") && e.handler.Response === Void
              ? [new Response(404, "NotFoundError")]
              : []
          ),
        }))
      )
    }),
    T.map((e) =>
      e.reduce((prev, { method, path, responses, ...rest }) => {
        prev[path] = {
          ...prev[path],
          [method]: {
            ...rest,
            responses: responses.reduce((prev, cur) => {
              prev[cur.statusCode] = cur.type
              return prev
            }, {}),
          },
        }

        return prev
      }, {})
    )
  )
}

class Response {
  constructor(
    public readonly statusCode: number,
    public readonly type: string | JSONSchema | SubSchema
  ) {}
}
