import { Compute } from "@effect-ts-demo/core/ext/Compute"
import * as T from "@effect-ts-demo/core/ext/Effect"
import * as O from "@effect-ts-demo/core/ext/Option"
import {
  Parser,
  ReqRes,
  ReqResSchemed,
  RequestSchemed,
} from "@effect-ts-demo/core/ext/Schema"
import * as S from "@effect-ts-demo/core/ext/Schema"
import * as H from "@effect-ts-demo/core/http/http-client"
import { pipe } from "@effect-ts/core"
import { flow } from "@effect-ts/core/Function"
import { M } from "@effect-ts/morphic"
import { Decode, decode, Errors } from "@effect-ts/morphic/Decoder"
import * as MO from "@effect-ts/morphic/Encoder"
import { Path } from "path-parser"

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

export function fetchApi(method: H.Method, path: string, body?: unknown) {
  const request = H.request(method, "JSON", "JSON")
  return getConfig(({ apiUrl, userProfileHeader }) =>
    pipe(
      request(`${apiUrl}${path}`, body)
        ["|>"](T.map((x) => x.body["|>"](O.toNullable)))
        ["|>"](
          H.withHeaders(userProfileHeader ? { ["x-user"]: userProfileHeader } : {})
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
  return (method: H.Method, path: string) => (req: RequestA) =>
    pipe(
      encodeRequest(req),
      T.chain((r) => fetchApi(method, path, r)),
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
  return (method: H.Method, path: string) => (req: RequestA) =>
    pipe(
      encodeRequest(req),
      (r) => fetchApi(method, new Path(path).build(req), r),
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
  method: H.Method = "POST"
) {
  const encodeRequest = MO.encode(Request)
  const decodeResponse = decode(Response)
  return (path: string) => fetchApi2(encodeRequest, decodeResponse)(method, path)
}

// TODO: validate headers vs path vs body vs query?
export function fetchApi3S<RequestA, RequestE, ResponseE = unknown, ResponseA = void>({
  Request,
  Response,
}: {
  // eslint-disable-next-line @typescript-eslint/ban-types
  Request: RequestSchemed<RequestE, RequestA>
  // eslint-disable-next-line @typescript-eslint/ban-types
  Response?: ReqRes<ResponseE, ResponseA> | ReqResSchemed<ResponseE, ResponseA>
}) {
  const Res = (Response ? S.extractSchema(Response) : S.Void) as ReqRes<
    ResponseE,
    ResponseA
  >
  const encodeRequest = Request.Encoder
  const decodeResponse = Parser.for(Res)["|>"](S.condemn)
  return fetchApi2S(encodeRequest, decodeResponse)(Request.method, Request.path)
}
