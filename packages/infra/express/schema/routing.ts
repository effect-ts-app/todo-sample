/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  isObjectSchema,
  JSONSchema,
  ParameterLocation,
  SubSchema,
} from "@atlas-ts/plutus"
import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import * as S from "@effect-ts-demo/core/ext/Schema"
import * as OpenApi from "@effect-ts-demo/core/ext/Schema/Openapi"
import { pipe } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as O from "@effect-ts/core/Option"
import * as Ex from "@effect-ts/express"
import express from "express"

import {
  makeRequestHandler,
  RequestHandler,
  RequestHandlerOptRes,
  SupportedErrors,
} from "./requestHandler"

type Methods = "GET" | "PUT" | "POST" | "PATCH" | "DELETE"

export interface RouteDescriptor<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  METHOD extends Methods = Methods
> {
  path: string
  method: METHOD
  handler: RequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA>
  _tag: "Schema"
}

export type RouteDescriptorAny = RouteDescriptor<any, any, any, any, any, any, any, any>

export function makeRouteDescriptor<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA = void,
  METHOD extends Methods = Methods
>(
  path: string,
  method: METHOD,
  handler: RequestHandlerOptRes<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA>
) {
  return { path, method, handler, _tag: "Schema" } as RouteDescriptor<
    R,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    METHOD
  >
}
export function get<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  R2 = unknown,
  PR = unknown
>(
  path: string,
  r: RequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA>,
  h?: (req: express.Request, res: express.Response) => L.Layer<R2, SupportedErrors, PR>
) {
  return pipe(
    Ex.get(
      path,
      makeRequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, R2, PR>(
        r,
        h
      )
    ),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "GET", r)))
  )
}

export function post<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA = void,
  R2 = unknown,
  PR = unknown
>(
  path: string,
  r: RequestHandlerOptRes<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA>,
  h?: (req: express.Request, res: express.Response) => L.Layer<R2, SupportedErrors, PR>
) {
  return pipe(
    Ex.post(
      path,
      makeRequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, R2, PR>(
        r,
        h
      )
    ),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "POST", r)))
  )
}

export function put<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA = void,
  R2 = unknown,
  PR = unknown
>(
  path: string,
  r: RequestHandlerOptRes<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA>,
  h?: (req: express.Request, res: express.Response) => L.Layer<R2, SupportedErrors, PR>
) {
  return pipe(
    Ex.put(
      path,
      makeRequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, R2, PR>(
        r,
        h
      )
    ),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "PUT", r)))
  )
}

export function patch<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA = void,
  R2 = unknown,
  PR = unknown
>(
  path: string,
  r: RequestHandlerOptRes<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA>,
  h?: (req: express.Request, res: express.Response) => L.Layer<R2, SupportedErrors, PR>
) {
  return pipe(
    Ex.patch(
      path,
      makeRequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, R2, PR>(
        r,
        h
      )
    ),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "PATCH", r)))
  )
}

function del<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA = void,
  R2 = unknown,
  PR = unknown
>(
  path: string,
  r: RequestHandlerOptRes<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA>,
  h?: (req: express.Request, res: express.Response) => L.Layer<R2, SupportedErrors, PR>
) {
  return pipe(
    Ex.delete(
      path,
      makeRequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, R2, PR>(
        r,
        h
      )
    ),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "DELETE", r)))
  )
}
export { del as delete }

export function makeFromSchema<ResA>(
  e: RouteDescriptor<any, any, any, any, any, any, ResA, any>
) {
  const jsonSchema_ = OpenApi.for
  const jsonSchema = <E, A>(r: S.ReqRes<E, A>) => jsonSchema_(r)
  const { Request: Req, Response: Res_ } = e.handler
  const Res = Res_ ? S.extractSchema(Res_) : S.Void
  // TODO: use the path vs body etc serialisation also in the Client.
  const makeReqQuerySchema = EO.fromNullable(Req.Query)["|>"](
    EO.chainEffect(jsonSchema)
  )
  const makeReqHeadersSchema = EO.fromNullable(Req.Headers)["|>"](
    EO.chainEffect(jsonSchema)
  )
  const makeReqCookieSchema = EO.fromNullable(Req.Cookie)["|>"](
    EO.chainEffect(jsonSchema)
  )
  const makeReqPathSchema = EO.fromNullable(Req.Path)["|>"](EO.chainEffect(jsonSchema))
  const makeReqBodySchema = EO.fromNullable(Req.Body)["|>"](EO.chainEffect(jsonSchema))
  //const makeReqSchema = schema(Req)

  const makeResSchema = jsonSchema_(Res)

  // TODO: custom void type - 204 response
  // https://github.com/Effect-TS/morphic/commit/da3a02fb527089807bcd5253652ee5a5b1efa371

  function makeParameters(inn: ParameterLocation) {
    return (a: O.Option<JSONSchema | SubSchema>) => {
      return a["|>"](O.chain((o) => (isObjectSchema(o) ? O.some(o) : O.none)))
        ["|>"](
          O.map((x) => {
            return Object.keys(x.properties!).map((p) => {
              const schema = x.properties![p]
              const required = Boolean(x.required?.includes(p))
              return { name: p, in: inn, required, schema }
            })
          })
        )
        ["|>"](O.getOrElse(() => []))
    }
  }

  return pipe(
    T.struct({
      reqQuery: makeReqQuerySchema,
      reqHeaders: makeReqHeadersSchema,
      reqBody: makeReqBodySchema,
      reqPath: makeReqPathSchema,
      reqCookie: makeReqCookieSchema,
      res: makeResSchema,
    }),
    T.map((_) => {
      const isEmpty = !e.handler.Response || e.handler.Response === S.Void
      return {
        path: e.path,
        method: e.method.toLowerCase(),
        parameters: [
          ..._.reqPath["|>"](makeParameters("path")),
          ..._.reqQuery["|>"](makeParameters("query")),
          ..._.reqHeaders["|>"](makeParameters("header")),
          ..._.reqCookie["|>"](makeParameters("cookie")),
        ],
        requestBody: O.toUndefined(
          _.reqBody["|>"](
            O.map((schema) => ({ content: { "application/json": { schema } } }))
          )
        ),
        responses: A.concat_(
          [
            isEmpty
              ? new Response(204, { description: "Empty" })
              : new Response(200, {
                  description: "OK",
                  content: { "application/json": { schema: _.res } },
                }),
            new Response(400, { description: "ValidationError" }),
          ],
          e.path.includes(":") && isEmpty
            ? [new Response(404, { description: "NotFoundError" })]
            : []
        ),
      }
    })
  )
}

class Response {
  constructor(
    public readonly statusCode: number,
    public readonly type: any //string | JSONSchema | SubSchema
  ) {}
}
