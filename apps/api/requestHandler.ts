import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import * as T from "@effect-ts/core/Effect"
import { flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as Sy from "@effect-ts/core/Sync"
import { M } from "@effect-ts/morphic"
import { Decode, Errors } from "@effect-ts/morphic/Decoder"
import { Encoder, encode } from "@effect-ts/morphic/Encoder"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"
import express from "express"

import { NotFoundError } from "./errors"

export type Request<
  PathA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA & HeaderA
> = M<{}, any, ReqA> & {
  Path?: M<{}, any, PathA>
  Body?: M<{}, any, BodyA>
  Query?: M<{}, any, QueryA>
  Headers?: M<{}, any, HeaderA>
}
type Encode<A, E> = Encoder<A, E>["encode"]

class ValidationError {
  public readonly _tag = "ValidationError"
  constructor(public readonly error: Errors) {}
}

function parseRequestParams<PathA, QueryA, BodyA, HeaderA>(
  parsers: RequestParsers<PathA, QueryA, BodyA, HeaderA>
) {
  return (req: express.Request) =>
    pipe(
      T.succeedWith(() => ({ ...req.query, ...req.body, ...req.params })),
      T.tap((pars) =>
        T.succeedWith(() =>
          console.log(
            `${new Date().toISOString()} ${req.method} ${
              req.originalUrl
            } processing request`,
            pars
          )
        )
      ),
      T.chain(() =>
        T.structPar({
          body: parsers.parseBody(req.body),
          headers: parsers.parseHeaders(req.headers),
          query: parsers.parseQuery(req.query),
          path: parsers.parsePath(req.params),
        })
      ),
      T.map(
        ({ body, headers, path, query }) =>
          ({
            ...O.toUndefined(body),
            ...O.toUndefined(query),
            ...O.toUndefined(headers),
            ...O.toUndefined(path),
          } as PathA & QueryA & BodyA & HeaderA)
      ),
      T.mapError((err) => new ValidationError(err))
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

function handleRequest<R, PathA, QueryA, BodyA, HeaderA, ResA, ResE>(
  requestParsers: RequestParsers<PathA, QueryA, BodyA, HeaderA>,
  encodeResponse: Encode<ResA, ResE>,
  handle: (r: PathA & QueryA & BodyA & HeaderA) => T.Effect<R, NotFoundError, ResA>
) {
  const parseRequest = parseRequestParams(requestParsers)
  const respond = respondSuccess(encodeResponse)
  return (req: express.Request, res: express.Response) =>
    pipe(
      parseRequest(req),
      T.chain(handle),
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
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA & HeaderA,
  ResA
> {
  Request: Request<PathA, QueryA, BodyA, HeaderA, ReqA>
  Response: M<{}, unknown, ResA>
  handle: (i: PathA & QueryA & BodyA & HeaderA) => T.Effect<R, NotFoundError, ResA>
}

export function makeRequestHandler<
  R,
  PathA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA & HeaderA,
  ResA
>({
  Request,
  Response,
  handle,
}: RequestHandler<R, PathA, QueryA, BodyA, HeaderA, ReqA, ResA>) {
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
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA & HeaderA,
  ResA
>(
  Request: RequestHandler<R, PathA, QueryA, BodyA, HeaderA, ReqA, ResA>["Request"]
): RequestParsers<PathA, QueryA, BodyA, HeaderA> {
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

  return {
    parseBody,
    parseHeaders,
    parsePath,
    parseQuery,
  }
}

interface RequestParsers<PathA, QueryA, BodyA, HeaderA> {
  parseHeaders: Decode<O.Option<HeaderA>>
  parseQuery: Decode<O.Option<QueryA>>
  parseBody: Decode<O.Option<BodyA>>
  parsePath: Decode<O.Option<PathA>>
}
