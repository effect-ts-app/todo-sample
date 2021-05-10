import { Compute } from "@effect-ts-demo/core/ext/Compute"
import * as T from "@effect-ts-demo/core/ext/Effect"
import { Parser, ReqRes, ReqResSchemed } from "@effect-ts-demo/core/ext/Schema"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { pipe } from "@effect-ts/core"
import { flow } from "@effect-ts/core/Function"
import { M } from "@effect-ts/morphic"
import { Decode, decode, Errors } from "@effect-ts/morphic/Decoder"
import * as MO from "@effect-ts/morphic/Encoder"
import fetch from "cross-fetch"

import { getConfig } from "./config"

export class FetchError {
  public readonly _tag = "FetchError"
  constructor(public readonly error: unknown) {}
}

export class ResponseError {
  public readonly _tag = "ResponseError"
  constructor(public readonly error: unknown) {}
}

export const mapResponseError = T.mapError((err: Errors) => new ResponseError(err))
export const mapResponseErrorS = T.mapError((err: unknown) => new ResponseError(err))

const makeAbort = T.succeedWith(() => new AbortController())
export function fetchApi(path: string, options?: Omit<RequestInit, "signal">) {
  const userId =
    (typeof localStorage !== "undefined" && localStorage.getItem("user-id")) || "0"
  return getConfig(({ apiUrl }) =>
    pipe(
      makeAbort,
      T.chain((abort) =>
        T.tryCatchPromiseWithInterrupt(
          () =>
            fetch(`${apiUrl}${path}`, {
              ...options,
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-User-Id": `${userId}`, // TODO; Authorization header, parsed by middleware, and passed on via RequestScope?

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

type Encode<A, E> = MO.Encoder<A, E>["encode"]

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

type ComputeUnlessClass<T> = T extends { new (...args: any[]): any } ? T : Compute<T>

export function fetchApi2S<RequestA, RequestE, ResponseA>(
  encodeRequest: (a: RequestA) => RequestE,
  decodeResponse: (u: unknown) => T.IO<unknown, ResponseA>
) {
  const decodeRes = flow(
    decodeResponse,
    T.mapError((err) => new ResponseError(err))
  )
  return (path: string, options?: Omit<RequestInit, "body">) => (req: RequestA) =>
    pipe(
      encodeRequest(req),
      (r) => fetchApi(path, { ...options, body: r ? JSON.stringify(r) : undefined }),
      T.chain(decodeRes),
      // TODO: as long as we don't use classes for Responses..
      T.map((i) => i as ComputeUnlessClass<ResponseA>)
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
  const encodeRequest = MO.encode(Request)
  const decodeResponse = decode(Response)
  return (path: string) =>
    fetchApi2(encodeRequest, decodeResponse)(path, {
      method,
    })
}

export function fetchApi3S<RequestA, RequestE, ResponseE = unknown, ResponseA = void>(
  {
    Request,
    Response,
  }: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    Request: ReqResSchemed<RequestE, RequestA>
    // eslint-disable-next-line @typescript-eslint/ban-types
    Response?: ReqRes<ResponseE, ResponseA> | ReqResSchemed<ResponseE, ResponseA>
  },
  method = "POST"
) {
  const Res = (Response ? S.extractSchema(Response) : S.Void) as ReqRes<
    ResponseE,
    ResponseA
  >
  const encodeRequest = Request.Encoder
  const decodeResponse = Parser.for(Res)["|>"](S.condemn)
  return (path: string) =>
    fetchApi2S(encodeRequest, decodeResponse)(path, {
      method,
    })
}
