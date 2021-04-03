import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import { M } from "@effect-ts/morphic"
import { Decode, decoder, Errors } from "@effect-ts/morphic/Decoder"
import { encoder } from "@effect-ts/morphic/Encoder"
import express from "express"

class ValidationError {
  public readonly _tag = "ValidationError"
  constructor(public readonly error: Errors) {}
}

function getRequestParams(req: express.Request) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return { ...req.query, ...req.body, ...req.params } as {}
}

function handleRequest<R, RequestA, ResponseA, ResponseE>(
  decodeRequest: Decode<RequestA>,
  encodeResponse: (e: ResponseA) => T.Effect<unknown, never, ResponseE>,
  handle: (r: RequestA) => T.Effect<R, never, ResponseA>
) {
  return (req: express.Request, res: express.Response) =>
    pipe(
      getRequestParams(req)
        ["|>"](decodeRequest)
        ["|>"](T.mapError((err) => new ValidationError(err))),
      T.chain(handle),
      T.chain(encodeResponse),
      T.chain((r) =>
        T.effectTotal(() => {
          res.status(200).send(r)
        })
      ),
      T.catch("_tag", "ValidationError", (err) =>
        T.effectTotal(() => {
          res.status(400).send(JSON.stringify(err))
        })
      )
    )
}

export function makeRequestHandler<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends M<{}, unknown, RequestA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Res extends M<{}, unknown, ResponseA>,
  R,
  RequestA,
  ResponseA
>({
  Request,
  Response,
  handle,
}: {
  Request: Req
  Response: Res
  handle: (i: RequestA) => T.Effect<R, never, ResponseA>
}) {
  const { decode } = decoder(Request)
  const { encode } = encoder(Response)
  return handleRequest(decode, encode, handle)
}
