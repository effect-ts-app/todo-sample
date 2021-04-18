import * as T from "@effect-ts/core/Effect"
import { flow, pipe } from "@effect-ts/core/Function"
import * as Sy from "@effect-ts/core/Sync"
import { M } from "@effect-ts/morphic"
import { Decode, Errors } from "@effect-ts/morphic/Decoder"
import { Encoder, encode } from "@effect-ts/morphic/Encoder"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"
import express from "express"

import { NotFoundError } from "./errors"

type Encode<A, E> = Encoder<A, E>["encode"]

class ValidationError {
  public readonly _tag = "ValidationError"
  constructor(public readonly error: Errors) {}
}

function parseRequestParams<A>(decodeRequest: Decode<A>) {
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
      T.chain(decodeRequest),
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

function handleRequest<R, ReqA, ResA, ResE>(
  decodeRequest: Decode<ReqA>,
  encodeResponse: Encode<ResA, ResE>,
  handle: (r: ReqA) => T.Effect<R, NotFoundError, ResA>
) {
  const parseRequest = parseRequestParams(decodeRequest)
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
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends M<{}, unknown, ReqA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResA>,
  R,
  ReqA,
  ResA
> {
  Request: Req
  Response: Res
  handle: (i: ReqA) => T.Effect<R, NotFoundError, ResA>
}

export function makeRequestHandler<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends M<{}, unknown, ReqA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResA>,
  R,
  ReqA,
  ResA
>({ Request, Response, handle }: RequestHandler<Req, Res, R, ReqA, ResA>) {
  const { decode: decodeRequest } = strictDecoder(Request)
  const encodeResponse = encode(Response)
  const { shrink: shrinkResponse } = strict(Response)

  return handleRequest(
    decodeRequest,
    flow(shrinkResponse, Sy.chain(encodeResponse)),
    handle
  )
}
