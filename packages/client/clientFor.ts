/* eslint-disable @typescript-eslint/no-explicit-any */

import * as T from "@effect-ts/core/Effect"
import { Has } from "@effect-ts/core/Has"
import { flow, pipe } from "@effect-ts-app/core/ext/Function"
import * as S from "@effect-ts-app/core/ext/Schema"
import { ParsedShapeOf } from "@effect-ts-app/core/ext/Schema"
import * as utils from "@effect-ts-app/core/ext/utils"
import { typedKeysOf } from "@effect-ts-app/core/ext/utils"
import * as H from "@effect-ts-app/core/http/http-client"
import { Path } from "path-parser"

import { ApiConfig } from "./config"
import {
  fetchApi,
  fetchApi3S,
  FetchError,
  mapResponseErrorS,
  ResponseError,
} from "./fetch"

export * from "./config"

type Requests = Record<string, Record<string, any>>

export function clientFor<M extends Requests>(models: M) {
  return typedKeysOf(models).reduce((prev, cur) => {
    const h = models[cur]
    const res = h.Response ?? S.Void

    const Request = S.extractRequest(h)

    const b = Object.assign({}, h, { Request })

    // if we don't need props, then also dont require an argument.
    const props = [Request.Body, Request.Query, Request.Path]
      .filter((x) => x)
      .flatMap((x) => Object.keys(x.Api.props))
    // TODO: auto determine if need headers? ie via: { input: (body/query), headers: Z } or as separate arguments ?
    // @ts-expect-error doc
    prev[utils.uncapitalize(cur)] =
      Request.method === "GET"
        ? props.length === 0
          ? pipe(
              fetchApi(Request.method, Request.path),
              T.chain(
                // @ts-expect-error doc
                flow(
                  (res.Parser ?? S.Parser.for(res))["|>"](S.condemnFail),
                  // @ts-expect-error doc
                  mapResponseErrorS
                )
              )
            )
          : (req: any) =>
              pipe(
                fetchApi(Request.method, new Path(Request.path).build(req)),
                T.chain(
                  // @ts-expect-error doc
                  flow(
                    (res.Parser ?? S.Parser.for(res))["|>"](S.condemnFail),
                    // @ts-expect-error doc
                    mapResponseErrorS
                  )
                )
              )
        : props.length === 0
        ? fetchApi3S(b)({})
        : (req: any) => fetchApi3S(b)(req) // generate handler

    return prev
  }, {} as RequestHandlers<Has<ApiConfig> & Has<H.Http>, FetchError | ResponseError, M>)
}

export type ExtractResponse<T> = T extends { Model: S.SchemaAny }
  ? ParsedShapeOf<T["Model"]>
  : T extends S.SchemaAny
  ? ParsedShapeOf<T>
  : T extends unknown
  ? S.Void
  : never

type RequestHandlers<R, E, M extends Requests> = {
  // TOdo; expose a ClientShape joining Path etc?
  [K in keyof M & string as Uncapitalize<K>]: keyof S.GetRequest<
    M[K]
  >[S.schemaField]["Api"]["props"] extends never
    ? T.Effect<R, E, ExtractResponse<M[K]["Response"]>>
    : (
        req: InstanceType<S.GetRequest<M[K]>>
      ) => T.Effect<R, E, ExtractResponse<M[K]["Response"]>>
}
