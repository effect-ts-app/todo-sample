import * as T from "@effect-ts-demo/todo-types/ext/Effect"
import { pipe } from "@effect-ts/core"
import { flow } from "@effect-ts/core/Function"
import { M } from "@effect-ts/morphic"
import { Decode, decode, Errors } from "@effect-ts/morphic/Decoder"
import { encode, Encoder } from "@effect-ts/morphic/Encoder"
import fetch from "cross-fetch"

import { getConfig } from "./config"

export class FetchError {
  public readonly _tag = "FetchError"
  constructor(public readonly error: unknown) {}
}

export class ResponseError {
  public readonly _tag = "ResponseError"
  constructor(public readonly error: Errors) {}
}

export const mapResponseError = T.mapError((err: Errors) => new ResponseError(err))

const makeAbort = T.effectTotal(() => new AbortController())
export function fetchApi(path: string, options?: Omit<RequestInit, "signal">) {
  return getConfig(({ apiUrl }) =>
    pipe(
      makeAbort,
      T.chain((abort) =>
        T.fromPromiseWithInterrupt(
          () =>
            fetch(`${apiUrl}${path}`, {
              ...options,
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...options?.headers,
              },
              signal: abort.signal,
            }).then((r) =>
              r.status === 204
                ? undefined
                : // unknown is better than any, as it demands to handle the unknown value
                  (r.json() as Promise<unknown>)
            ),
          (err) => new FetchError(err),
          () => abort.abort()
        )
      )
    )
  )
}

type Encode<A, E> = Encoder<A, E>["encode"]

export function fetchApi2<RequestA, RequestE, ResponseA>(
  encodeRequest: Encode<RequestA, RequestE>,
  decodeResponse: Decode<ResponseA>
) {
  const decodeRes = flow(decodeResponse, mapResponseError)
  return (path: string, options?: Omit<RequestInit, "body">) => (req: RequestA) =>
    pipe(
      encodeRequest(req),
      T.chain((r) =>
        fetchApi(path, { ...options, body: r ? JSON.stringify(r) : undefined })
      ),
      T.chain(decodeRes)
    )
}

export function fetchApi3<RequestA, RequestE, ResponseE, ResponseA>(
  {
    Request,
    Response,
  }: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    Request: M<{}, RequestE, RequestA>
    // eslint-disable-next-line @typescript-eslint/ban-types
    Response: M<{}, ResponseE, ResponseA>
  },
  method = "POST"
) {
  const encodeRequest = encode(Request)
  const decodeResponse = decode(Response)
  return (path: string) => fetchApi2(encodeRequest, decodeResponse)(path, { method })
}
