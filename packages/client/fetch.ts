/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipe } from "@effect-ts/core"
import { flow } from "@effect-ts/core/Function"
import { Compute } from "@effect-ts-app/core/Compute"
import * as T from "@effect-ts-app/core/Effect"
import * as H from "@effect-ts-app/core/http/http-client"
import * as O from "@effect-ts-app/core/Option"
import {
  Parser,
  ReqRes,
  ReqResSchemed,
  RequestSchemed,
} from "@effect-ts-app/core/Schema"
import * as S from "@effect-ts-app/core/Schema"
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

export type ComputeUnlessClass<T> = T extends { new (...args: any[]): any }
  ? T
  : Compute<T>

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
