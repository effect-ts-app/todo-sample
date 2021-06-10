/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import { flow, pipe } from "@effect-ts/core/Function"
import { Has } from "@effect-ts/core/Has"
import * as H from "@effect-ts-app/core/http/http-client"
import * as MO from "@effect-ts-app/core/Schema"
import {
  Parser,
  ReqRes,
  ReqResSchemed,
  RequestSchemed,
} from "@effect-ts-app/core/Schema"
import { Path } from "path-parser"

import { ApiConfig, ExtractResponse } from "../clientFor"
import { ComputeUnlessClass, fetchApi, ResponseError } from "../fetch"
import * as Ts from "./_index"
import { TaskView } from "./views"

/*
TODOS:
- express this somehow to openapi...
- make portable


FUTURE:
- select child props
- translate selections to data source?
- select from single item query, instead of just multi items.
*/

const mksearchWithFields = () => {
  const h = Ts.Search
  const res = h.Response ?? MO.Void

  const Request = MO.extractRequest(h)

  const b = Object.assign({}, h, { Request })
  //export function makeAdapter<Props extends MO.PropertyRecord>(props: Props) {
  type Props = typeof TaskView.Model.Api.props
  function a<Key extends keyof Props>(
    req: Ts.Search.default & {
      $select: readonly Key[] // TODO:
    }
  ): T.Effect<
    H.RequestEnv & Has<ApiConfig>,
    ResponseError | H.HttpError<string>,
    MO.ParsedShapeOf<MO.Adapted<Props, Key>>
  >
  function a(
    req: Ts.Search.default
  ): T.Effect<
    H.RequestEnv & Has<ApiConfig>,
    ResponseError | H.HttpError<string>,
    ExtractResponse<typeof res>
  > // todo
  function a(req: any): any {
    return pipe(
      fetchApi3S(b, Ts.Search.adapt)(req)
      // GET
      // fetchApi(Request.method, new Path(Request.path).build(req)),
      // T.chain(
      //   // @ts-expect-error doc
      //   flow(
      //     (res.Parser ?? MO.Parser.for(res))["|>"](MO.condemnFail),
      //     // @ts-expect-error doc
      //     mapResponseErrorS
      //   )
      // )
    )
  }
  return a
}

export const searchWithFields = mksearchWithFields()

function fetchApi2S<RequestA, RequestE, ResponseA>(
  encodeRequest: (a: RequestA) => RequestE,
  decodeResponse: (u: unknown, req: RequestA) => T.IO<unknown, ResponseA>
) {
  const decodeRes = flow(
    decodeResponse,
    T.mapError((err) => new ResponseError(err))
  )
  return (method: H.Method, path: string) => (req: RequestA) =>
    pipe(
      encodeRequest(req),
      (r) => fetchApi(method, new Path(path).build(req), r),
      T.chain((x) => decodeRes(x, req)),
      // TODO: as long as we don't use classes for Responses..
      T.map((i) => i as ComputeUnlessClass<ResponseA>)
    )
}

// TODO: validate headers vs path vs body vs query?
// export function fetchApi3S<
//   RequestA,
//   RequestE,
//   ResponseE = unknown,
//   ResponseA = void
// >(): (
//   req: RequestA & { fields: readonly (keyof Response["items"][number])[] }
// ) => T.Effect<
//   H.RequestEnv & Has<ApiConfig>,
//   ResponseError | H.HttpError<string>,
//   ResponseA
// >
// export function fetchApi3S<
//   RequestA,
//   RequestE,
//   ResponseE = unknown,
//   ResponseA = void
// >(): (
//   req: RequestA
// ) => T.Effect<
//   H.RequestEnv & Has<ApiConfig>,
//   ResponseError | H.HttpError<string>,
//   ResponseA
// >
function fetchApi3S<RequestA, RequestE, ResponseE = unknown, ResponseA = void>(
  {
    Request,
    Response,
  }: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    Request: RequestSchemed<RequestE, RequestA>
    // eslint-disable-next-line @typescript-eslint/ban-types
    Response?: ReqRes<ResponseE, ResponseA> | ReqResSchemed<ResponseE, ResponseA>
  },
  adapt?: any
) {
  const Res = (Response ? MO.extractSchema(Response) : MO.Void) as ReqRes<
    ResponseE,
    ResponseA
  >
  const encodeRequest = Request.Encoder
  const decodeResponse = (u: any, res: any) =>
    Parser.for(adapt ? adapt(res) : Res)["|>"](MO.condemn)(u)
  return fetchApi2S(encodeRequest, decodeResponse)(Request.method, Request.path)
}
