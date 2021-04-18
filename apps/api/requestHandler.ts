/* eslint-disable @typescript-eslint/ban-types */
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as E from "@effect-ts/core/Either"
import { flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as Sy from "@effect-ts/core/Sync"
import { M } from "@effect-ts/morphic"
import { ContextEntry, Decode, Errors } from "@effect-ts/morphic/Decoder"
import { Encoder, encode } from "@effect-ts/morphic/Encoder"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"
import express from "express"

import { NotFoundError } from "./errors"

export type Request<
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & CookieA & QueryA & HeaderA & BodyA
> = M<{}, unknown, ReqA> & {
  Cookie?: M<{}, Record<string, string>, CookieA>
  Path?: M<{}, Record<string, string>, PathA>
  Body?: M<{}, unknown, BodyA>
  Query?: M<{}, Record<string, string>, QueryA>
  Headers?: M<{}, Record<string, string>, HeaderA>
}
type Encode<A, E> = Encoder<A, E>["encode"]

class ValidationError {
  public readonly _tag = "ValidationError"
  constructor(public readonly error: unknown[]) {}
}

function getErrorMessage(current: ContextEntry) {
  switch (current.type.name) {
    case "NonEmptyString":
      return "Must not be empty"
  }
  if (current.type.name?.startsWith("NonEmptyArray<")) {
    return "Must not be empty"
  }
  return `Invalid value specified`
}
export function decodeErrors(x: Errors) {
  return pipe(
    x,
    A.map(({ message, context: [root, ...rest], value }) => {
      const processCtx = (current: ContextEntry, path?: string, rootType?: string) => ({
        message: message ? message : getErrorMessage(current),
        expectedType: current.type.name,
        rootType,
        path,
        provided: {
          value,
          type: typeof value,
          constructor:
            value && typeof value === "object"
              ? ` ${value.constructor.name}`
              : undefined,
        },
      })
      return rest.length
        ? processCtx(
            rest[rest.length - 1],
            rest
              .map((x) => x.key)
              // the root object inside an array, then has no key again.
              .filter(Boolean)
              .join("."),
            root.type.name
          )
        : processCtx(root)
    })
  )
}

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
      T.chain(() =>
        T.structPar({
          body: parsers.parseBody(body)["|>"](T.mapError(decodeErrors))["|>"](T.either),
          cookie: parsers
            .parseCookie(cookies)
            ["|>"](T.mapError(decodeErrors))
            ["|>"](T.either),
          headers: parsers
            .parseHeaders(headers)
            ["|>"](T.mapError(decodeErrors))
            ["|>"](T.either),
          query: parsers
            .parseQuery(query)
            ["|>"](T.mapError(decodeErrors))
            ["|>"](T.either),
          path: parsers
            .parsePath(params)
            ["|>"](T.mapError(decodeErrors))
            ["|>"](T.either),
        })
      ),
      T.chain((r: any) => {
        // todo; proper
        const errors = Object.keys(r).reduce((prev, cur) => {
          const v = r[cur]
          if (E.isLeft(v)) {
            prev.push({ type: cur, errors: v.left })
          }
          return prev
        }, [] as any[])

        if (errors.length) {
          return T.fail(new ValidationError(errors))
        }
        return T.succeed({
          body: r.body.right,
          cookie: r.cookie.right,
          headers: r.headers.right,
          query: r.query.right,
          path: r.path.right,
        } as { body: O.Option<BodyA>; cookie: O.Option<CookieA>; headers: O.Option<HeaderA>; query: O.Option<QueryA>; path: O.Option<PathA> })
      })
    )
}

function respondSuccess<A, E>(encodeResponse: Encode<A, E>) {
  return (res: express.Response) =>
    flow(
      encodeResponse,
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
    r: PathA & CookieA & QueryA & HeaderA & BodyA & {}
  ) => T.Effect<R, NotFoundError, ResA>
) {
  const parseRequest = parseRequestParams(requestParsers)
  const respond = respondSuccess(encodeResponse)
  return (req: express.Request, res: express.Response) =>
    pipe(
      parseRequest(req),
      T.chain(({ body, cookie, headers, path, query }) =>
        handle({
          ...O.toUndefined(cookie),
          ...O.toUndefined(body),
          ...O.toUndefined(query),
          ...O.toUndefined(headers),
          ...O.toUndefined(path),
        } as PathA & CookieA & QueryA & HeaderA & BodyA)
      ),
      T.chain(respond(res)),
      T.catch("_tag", "ValidationError", (err) =>
        T.succeedWith(() => {
          res.status(400).send(err.error)
        })
      ),
      T.catch("_tag", "NotFoundError", (err) =>
        T.succeedWith(() => {
          res.status(404).send(err)
        })
      )
    )
}

export interface RequestHandler<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & CookieA & QueryA & HeaderA & BodyA,
  ResA
> {
  Request: Request<PathA, CookieA, QueryA, BodyA, HeaderA, ReqA>
  Response: M<{}, unknown, ResA>
  handle: (
    i: PathA & CookieA & QueryA & HeaderA & BodyA & {}
  ) => T.Effect<R, NotFoundError, ResA>
}

export function makeRequestHandler<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & CookieA & QueryA & HeaderA & BodyA,
  ResA
>({
  Request,
  Response,
  handle,
}: RequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA>) {
  const encodeResponse = encode(Response)
  const { shrink: shrinkResponse } = strict(Response)

  return handleRequest(
    makeRequestParsers(Request),
    flow(shrinkResponse, Sy.chain(encodeResponse)),
    handle
  )
}

function makeRequestParsers<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & CookieA & QueryA & HeaderA & BodyA,
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
    ["|>"](O.map(strictDecoder))
    ["|>"](O.map((x) => x.decode))
    ["|>"](EO.fromOption)
  const parseHeaders = (u: unknown) =>
    ph["|>"](EO.chain((d) => d(u)["|>"](EO.fromEffect)))

  const pq = O.fromNullable(Request.Query)
    ["|>"](O.map(strictDecoder))
    ["|>"](O.map((x) => x.decode))
    ["|>"](EO.fromOption)
  const parseQuery = (u: unknown) =>
    pq["|>"](EO.chain((d) => d(u)["|>"](EO.fromEffect)))

  const pb = O.fromNullable(Request.Body)
    ["|>"](O.map(strictDecoder))
    ["|>"](O.map((x) => x.decode))
    ["|>"](EO.fromOption)
  const parseBody = (u: unknown) => pb["|>"](EO.chain((d) => d(u)["|>"](EO.fromEffect)))

  const pp = O.fromNullable(Request.Path)
    ["|>"](O.map(strictDecoder))
    ["|>"](O.map((x) => x.decode))
    ["|>"](EO.fromOption)
  const parsePath = (u: unknown) => pp["|>"](EO.chain((d) => d(u)["|>"](EO.fromEffect)))

  const pc = O.fromNullable(Request.Cookie)
    ["|>"](O.map(strictDecoder))
    ["|>"](O.map((x) => x.decode))
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

interface RequestParsers<PathA, CookieA, QueryA, BodyA, HeaderA> {
  parseHeaders: Decode<O.Option<HeaderA>>
  parseQuery: Decode<O.Option<QueryA>>
  parseBody: Decode<O.Option<BodyA>>
  parsePath: Decode<O.Option<PathA>>
  parseCookie: Decode<O.Option<CookieA>>
}
