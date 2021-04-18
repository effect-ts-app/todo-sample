import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/express"
import { M } from "@effect-ts/morphic"

import { makeRequestHandler, RequestHandler } from "@/requestHandler"

// Mutable test
export function getRM(routeMap: any[]) {
  return <
    // eslint-disable-next-line @typescript-eslint/ban-types
    Req extends M<{}, unknown, ReqA>,
    // eslint-disable-next-line @typescript-eslint/ban-types
    Res extends M<{}, unknown, ResA>,
    R,
    ReqA,
    ResA
  >(
    path: string,
    r: RequestHandler<Req, Res, R, ReqA, ResA>
  ) => {
    return pipe(
      Ex.get(path, makeRequestHandler(r)),
      // TODO: path + method.
      T.tap(() => T.succeed(() => routeMap.push({ path, method: "GET", r })))
    )
  }
}

export interface RouteDescriptor<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends M<{}, unknown, ReqA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResA>,
  R,
  ReqA,
  ResA
> {
  path: string
  method: "GET" | "PUT" | "POST" | "PATCH" | "DELETE"
  r: RequestHandler<Req, Res, R, ReqA, ResA>
}

// Return value
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
    T.zipRight(
      T.succeedWith(
        () => ({ path, method: "GET", r } as RouteDescriptor<Req, Res, R, ReqA, ResA>)
      )
    )
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
    T.zipRight(
      T.succeedWith(
        () => ({ path, method: "POST", r } as RouteDescriptor<Req, Res, R, ReqA, ResA>)
      )
    )
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
    T.zipRight(
      T.succeedWith(
        () => ({ path, method: "PUT", r } as RouteDescriptor<Req, Res, R, ReqA, ResA>)
      )
    )
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
    T.zipRight(
      T.succeedWith(
        () => ({ path, method: "PATCH", r } as RouteDescriptor<Req, Res, R, ReqA, ResA>)
      )
    )
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
    T.zipRight(
      T.succeedWith(
        () =>
          ({ path, method: "DELETE", r } as RouteDescriptor<Req, Res, R, ReqA, ResA>)
      )
    )
  )
}

export { del as delete }
