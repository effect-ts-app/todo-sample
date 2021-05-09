/* eslint-disable @typescript-eslint/ban-types */
import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { Encoder, Parser } from "@effect-ts-demo/core/ext/Schema"
import { DSL, Has } from "@effect-ts/core"
import { makeAssociative } from "@effect-ts/core/Associative"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import { flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as EU from "@effect-ts/core/Utils"
import express from "express"

import { NotFoundError } from "../../errors"
import { UserSVC } from "../../services"

export type Request<
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA
> = S.ReqResSchemed<unknown, ReqA> & {
  Cookie?: S.ReqResSchemed<Record<string, string>, CookieA>
  Path?: S.ReqResSchemed<Record<string, string>, PathA>
  Body?: S.ReqResSchemed<unknown, BodyA>
  Query?: S.ReqResSchemed<Record<string, string>, QueryA>
  Headers?: S.ReqResSchemed<Record<string, string>, HeaderA>
}
type Encode<A, E> = (a: A) => E

class ValidationError {
  public readonly _tag = "ValidationError"
  constructor(public readonly errors: A.Array<unknown>) {}
}

export type SupportedErrors = ValidationError | NotFoundError

// function getErrorMessage(current: ContextEntry) {
//   switch (current.type.name) {
//     case "NonEmptyString":
//       return "Must not be empty"
//   }
//   if (current.type.name?.startsWith("NonEmptyArray<")) {
//     return "Must not be empty"
//   }
//   return `Invalid value specified`
// }
export function decodeErrors(x: unknown) {
  return [x]
}

const ValidationApplicative = T.getValidationApplicative(
  makeAssociative<A.Array<{ type: string; errors: ReturnType<typeof decodeErrors> }>>(
    (l, r) => l.concat(r)
  )
)

const structValidation = DSL.structF(ValidationApplicative)

function parseRequestParams<PathA, CookieA, QueryA, BodyA, HeaderA>(
  parsers: RequestParsers<PathA, CookieA, QueryA, BodyA, HeaderA>
) {
  return ({
    body,
    cookies,
    headers,
    method,
    originalUrl,
    params,
    query,
  }: express.Request) =>
    pipe(
      T.succeedWith(() => ({ path: params, query, body, headers, cookies })),
      T.tap((pars) =>
        T.succeedWith(() =>
          console.log(
            `${new Date().toISOString()} ${method} ${originalUrl} processing request`,
            pars
          )
        )
      ),
      T.chain(() => {
        const result = structValidation(
          mapErrors_(
            {
              body: parsers.parseBody(body),
              cookie: parsers.parseCookie(cookies),
              headers: parsers.parseHeaders(headers),
              query: parsers.parseQuery(query),
              path: parsers.parsePath(params),
            },
            makeError
          )
        )
        return result
      }),
      T.mapError((err) => new ValidationError(err))
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapErrors_<E, NE, NER extends Record<string, T.Effect<any, E, any>>>(
  t: NER, // TODO: enforce non empty
  mapErrors: (k: keyof NER) => (err: E) => NE
): {
  [K in keyof NER]: T.Effect<EU._R<NER[K]>, NE, EU._A<NER[K]>>
} {
  return typedKeysOf(t).reduce(
    (prev, cur) => {
      prev[cur] = t[cur]["|>"](T.mapError(mapErrors(cur)))
      return prev
    },
    {} as {
      [K in keyof NER]: T.Effect<EU._R<NER[K]>, NE, EU._A<NER[K]>>
    }
  )
}

export const typedKeysOf = <T>(obj: T) => Object.keys(obj) as (keyof T)[]

function makeError(type: string) {
  return (e: unknown) => [{ type, errors: decodeErrors(e) }]
}

function respondSuccess<A, E>(encodeResponse: Encode<A, E>) {
  return (res: express.Response) =>
    flow(
      encodeResponse,
      T.succeed,
      T.chain((r) =>
        T.succeedWith(() => {
          r === undefined
            ? res.status(204).send()
            : res.status(200).send(r === null ? JSON.stringify(null) : r)
        })
      )
    )
}

function handleRequest<R, PathA, CookieA, QueryA, BodyA, HeaderA, ResA, ResE>(
  requestParsers: RequestParsers<PathA, CookieA, QueryA, BodyA, HeaderA>,
  encodeResponse: Encode<ResA, ResE>,
  handle: (
    r: PathA & QueryA & BodyA & {}
  ) => T.Effect<R & Has.Has<UserSVC.UserEnv>, SupportedErrors, ResA>
) {
  const parseRequest = parseRequestParams(requestParsers)
  const respond = respondSuccess(encodeResponse)
  return (req: express.Request, res: express.Response) =>
    pipe(
      parseRequest(req),
      T.chain(({ body, path, query }) =>
        handle({
          ...O.toUndefined(body),
          ...O.toUndefined(query),
          ...O.toUndefined(path),
        } as PathA & QueryA & BodyA)["|>"](
          // TODO; able to configure only when needed.
          T.provideSomeLayer(UserSVC.LiveUserEnv(req.headers["x-user-id"] as unknown))
        )
      ),
      T.chain(respond(res)),
      T.catch("_tag", "ValidationError", (err) =>
        T.succeedWith(() => {
          res.status(400).send(err.errors)
        })
      ),
      T.catch("_tag", "NotFoundError", (err) =>
        T.succeedWith(() => {
          res.status(404).send(err)
        })
      ),
      // final catch all
      T.catchAll((err: any) =>
        T.succeedWith(() =>
          console.error(
            "Program error, compiler probably silenced, got an unsupported Error in Error Channel of Effect",
            err
          )
        )["|>"](T.chain(T.die))
      ),
      T.tapCause(() => T.succeedWith(() => res.status(500).send()))
    )
}

export interface RequestHandler<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA
> {
  Request: Request<PathA, CookieA, QueryA, BodyA, HeaderA, ReqA>
  Response: S.ReqRes<unknown, ResA>
  handle: (i: PathA & QueryA & BodyA & {}) => T.Effect<R, SupportedErrors, ResA>
}

export function makeRequestHandler<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA
>({
  Request,
  Response,
  handle,
}: RequestHandler<
  R & Has.Has<UserSVC.UserEnv>,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA,
  ResA
>) {
  const encodeResponse = Encoder.for(Response)
  //const { shrink: shrinkResponse } = strict(Response)
  // flow(shrinkResponse, Sy.chain(encodeResponse))

  return handleRequest(makeRequestParsers(Request), encodeResponse, handle)
}
function makeRequestParsers<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA
>(
  Request: RequestHandler<
    R,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA
  >["Request"]
): RequestParsers<PathA, CookieA, QueryA, BodyA, HeaderA> {
  const ph = O.fromNullable(Request.Headers)
    ["|>"](O.map((s) => s.Model))
    ["|>"](O.map(Parser.for)) // todo strict
    ["|>"](O.map(S.condemn))
    ["|>"](EO.fromOption)
  const parseHeaders = (u: unknown) =>
    ph["|>"](EO.chain((d) => d(u)["|>"](EO.fromEffect)))

  const pq = O.fromNullable(Request.Query)
    ["|>"](O.map((s) => s.Model))
    ["|>"](O.map(Parser.for)) // todo strict
    ["|>"](O.map(S.condemn))
    ["|>"](EO.fromOption)
  const parseQuery = (u: unknown) =>
    pq["|>"](EO.chain((d) => d(u)["|>"](EO.fromEffect)))

  const pb = O.fromNullable(Request.Body)
    ["|>"](O.map((s) => s.Model))
    ["|>"](O.map(Parser.for)) // todo strict
    ["|>"](O.map(S.condemn))
    ["|>"](EO.fromOption)
  const parseBody = (u: unknown) => pb["|>"](EO.chain((d) => d(u)["|>"](EO.fromEffect)))

  const pp = O.fromNullable(Request.Path)
    ["|>"](O.map((s) => s.Model))
    ["|>"](O.map(Parser.for)) // todo strict
    ["|>"](O.map(S.condemn))
    ["|>"](EO.fromOption)
  const parsePath = (u: unknown) => pp["|>"](EO.chain((d) => d(u)["|>"](EO.fromEffect)))

  const pc = O.fromNullable(Request.Cookie)
    ["|>"](O.map((s) => s.Model))
    ["|>"](O.map(Parser.for)) // todo strict
    ["|>"](O.map(S.condemn))
    ["|>"](EO.fromOption)
  const parseCookie = (u: unknown) =>
    pc["|>"](EO.chain((d) => d(u)["|>"](EO.fromEffect)))

  return {
    parseBody,
    parseCookie,
    parseHeaders,
    parsePath,
    parseQuery,
  }
}

type Decode<A> = (u: unknown) => T.IO<unknown, A>

interface RequestParsers<PathA, CookieA, QueryA, BodyA, HeaderA> {
  parseHeaders: Decode<O.Option<HeaderA>>
  parseQuery: Decode<O.Option<QueryA>>
  parseBody: Decode<O.Option<BodyA>>
  parsePath: Decode<O.Option<PathA>>
  parseCookie: Decode<O.Option<CookieA>>
}
