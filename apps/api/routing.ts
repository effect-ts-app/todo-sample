/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  isObjectSchema,
  JSONSchema,
  ParameterLocation,
  SubSchema,
} from "@atlas-ts/plutus"
import { schema } from "@atlas-ts/plutus/Schema"
import { Has, pipe } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"
import { _A } from "@effect-ts/core/Utils"
import * as Ex from "@effect-ts/express"

import { makeRequestHandler, RequestHandler } from "@/requestHandler"

import * as RS from "./routingSchema"
import { UserSVC } from "./services"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { Void } from "@effect-ts-demo/core/ext/Model"
import * as S from "@effect-ts-demo/core/ext/Schema"
import * as OpenApi from "@effect-ts-demo/core/ext/Schema/Openapi"

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
  handler: RequestHandler<
    R & Has.Has<UserSVC.UserEnv>,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA
  >
  _tag: "Morphic"
}

export function makeRouteDescriptor<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  METHOD extends Methods = Methods
>(
  path: string,
  method: METHOD,
  handler: RequestHandler<
    R & Has.Has<UserSVC.UserEnv>,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA
  >
) {
  return { path, method, handler, _tag: "Morphic" } as RouteDescriptor<
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
  ResA
>(
  path: string,
  r: RequestHandler<
    R & Has.Has<UserSVC.UserEnv>,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA
  >
) {
  return pipe(
    Ex.get(path, makeRequestHandler(r)),
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
  ResA
>(
  path: string,
  r: RequestHandler<
    R & Has.Has<UserSVC.UserEnv>,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA
  >
) {
  return pipe(
    Ex.post(path, makeRequestHandler(r)),
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
  ResA
>(
  path: string,
  r: RequestHandler<
    R & Has.Has<UserSVC.UserEnv>,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA
  >
) {
  return pipe(
    Ex.put(path, makeRequestHandler(r)),
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
  ResA
>(
  path: string,
  r: RequestHandler<
    R & Has.Has<UserSVC.UserEnv>,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA
  >
) {
  return pipe(
    Ex.patch(path, makeRequestHandler(r)),
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
  ResA
>(
  path: string,
  r: RequestHandler<
    R & Has.Has<UserSVC.UserEnv>,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA
  >
) {
  return pipe(
    Ex.delete(path, makeRequestHandler(r)),
    T.zipRight(T.succeedWith(() => makeRouteDescriptor(path, "DELETE", r)))
  )
}
export { del as delete }

/**
 * Work in progress JSONSchema generator.
 */
export function makeSchema(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r: Iterable<
    | RouteDescriptor<any, any, any, any, any, any, any, any>
    | RS.RouteDescriptor<any, any, any, any, any, any, any, any>
  >
) {
  return pipe(
    Chunk.from(r),
    //Chunk.filter((x) => x._tag === "Morphic"),
    T.forEach((e) => (e._tag === "Morphic" ? makeFromMorphic(e) : makeFromSchema(e))),
    T.map((e) => {
      const map = ({ method, path, responses, ...rest }: _A<typeof e>) => ({
        [method]: {
          ...rest,
          responses: A.reduce_(
            responses,
            {} as Record<Response["statusCode"], Response["type"]>,
            (prev, cur) => {
              prev[cur.statusCode] = cur.type
              return prev
            }
          ),
        },
      })
      return Chunk.reduce_(
        e,
        {} as Record<string, Record<Methods, ReturnType<typeof map>>>,
        (prev, e) => {
          prev[e.path] = {
            ...prev[e.path],
            ...map(e),
          }
          return prev
        }
      )
    })
  )
}

function makeFromSchema(e: RS.RouteDescriptor<any, any, any, any, any, any, any, any>) {
  const jsonSchema_ = OpenApi.for
  const jsonSchema = <E, A>(r: S.ReqResSchemed<E, A>) => jsonSchema_(r.Model)
  const { Request: Req, Response: Res } = e.handler
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
    T.map((_) => ({
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
          e.handler.Response === S.Void
            ? new Response(204, { description: "Empty" })
            : new Response(200, {
                description: "OK",
                content: { "application/json": { schema: _.res } },
              }),
          new Response(400, { description: "ValidationError" }),
        ],
        e.path.includes(":") && e.handler.Response === S.Void
          ? [new Response(404, { description: "NotFoundError" })]
          : []
      ),
    }))
  )
}

function makeFromMorphic(e: RouteDescriptor<any, any, any, any, any, any, any, any>) {
  const { Request: Req, Response: Res } = e.handler
  // TODO: use the path vs body etc serialisation also in the Client.
  const makeReqQuerySchema = EO.fromNullable(Req.Query)["|>"](EO.chainEffect(schema))
  const makeReqHeadersSchema = EO.fromNullable(Req.Headers)["|>"](
    EO.chainEffect(schema)
  )
  const makeReqCookieSchema = EO.fromNullable(Req.Cookie)["|>"](EO.chainEffect(schema))
  const makeReqPathSchema = EO.fromNullable(Req.Path)["|>"](EO.chainEffect(schema))
  const makeReqBodySchema = EO.fromNullable(Req.Body)["|>"](EO.chainEffect(schema))
  //const makeReqSchema = schema(Req)
  const makeResSchema = schema(Res)

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
    T.map((_) => ({
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
          e.handler.Response === Void
            ? new Response(204, { description: "Empty" })
            : new Response(200, {
                description: "OK",
                content: { "application/json": { schema: _.res } },
              }),
          new Response(400, { description: "ValidationError" }),
        ],
        e.path.includes(":") && e.handler.Response === Void
          ? [new Response(404, { description: "NotFoundError" })]
          : []
      ),
    }))
  )
}

class Response {
  constructor(
    public readonly statusCode: number,
    public readonly type: any //string | JSONSchema | SubSchema
  ) {}
}
