import { schema } from "@atlas-ts/plutus/Schema"
import { pipe } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/express"
import { M } from "@effect-ts/morphic"

import { makeRequestHandler, RequestHandler } from "@/requestHandler"

type Methods = "GET" | "PUT" | "POST" | "PATCH" | "DELETE"
export interface RouteDescriptor<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends M<{}, unknown, ReqA>,
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
  Req extends M<{}, unknown, ReqA>,
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
  Req extends M<{}, unknown, ReqA>,
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
  Req extends M<{}, unknown, ReqA>,
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
  Req extends M<{}, unknown, ReqA>,
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
  Req extends M<{}, unknown, ReqA>,
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
  Req extends M<{}, unknown, ReqA>,
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

export function makeSchema(r: A.Array<RouteDescriptor<any, any, any, any, any, any>>) {
  return T.forEach_(r, (e) => {
    const makeReqSchema = schema(e.handler.Request)
    const makeResSchema = schema(e.handler.Response)

    // TODO: Response status code and error modeling (200, 204, 400, 404, 500).
    // TODO: void type - 204 response
    // https://github.com/Effect-TS/morphic/commit/da3a02fb527089807bcd5253652ee5a5b1efa371

    return T.struct({
      req: makeReqSchema,
      res: makeResSchema,
    })["|>"](T.map((_) => ({ path: e.path, method: e.method, ..._ })))
  })
}
