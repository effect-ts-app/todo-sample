export * from "./config"
import { flow, pipe } from "@effect-ts-demo/core/ext/Function"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { typedKeysOf } from "@effect-ts-demo/core/ext/utils"
import * as H from "@effect-ts-demo/core/http/http-client"
import * as T from "@effect-ts/core/Effect"
import { Has } from "@effect-ts/core/Has"
import { Path } from "path-parser"

import { ApiConfig } from "./config"
import {
  fetchApi,
  fetchApi3S,
  FetchError,
  mapResponseErrorS,
  ResponseError,
} from "./fetch"

type Requests = Record<string, { Request: any; Response?: any }>

export function clientFor<M extends Requests>(models: M) {
  return typedKeysOf(models).reduce((prev, cur) => {
    const h = models[cur]
    const res = h.Response ?? S.Void

    // if we don't need props, then also dont require an argument.
    const props = [h.Request.Body, h.Request.Query, h.Request.Path]
      .filter((x) => x)
      .flatMap((x) => x.Api.props)
    // todo; automatically determine if need a request input etc
    // auto determine if need headers? ie via: { input: (body/query), headers: Z } or as separate arguments ?
    // @ts-expect-error
    prev[cur] =
      h.Request.method === "GET"
        ? props.length === 0
          ? pipe(
              fetchApi(h.Request.method, h.Request.path),
              T.chain(
                // @ts-expect-error
                flow(
                  (res.Parser ?? S.Parser.for(res))["|>"](S.condemnFail),
                  // @ts-expect-error
                  mapResponseErrorS
                )
              )
            )
          : (req) =>
              pipe(
                fetchApi(h.Request.method, new Path(h.Request.path).build(req)),
                T.chain(
                  // @ts-expect-error
                  flow(
                    (res.Parser ?? S.Parser.for(res))["|>"](S.condemnFail),
                    // @ts-expect-error
                    mapResponseErrorS
                  )
                )
              )
        : props.length === 0
        ? fetchApi3S(h)({})
        : (req) => fetchApi3S(h)(req) // generate handler

    return prev
  }, {} as RequestHandlers<Has<ApiConfig> & Has<H.Http>, FetchError | ResponseError, M>)
}

type JoinIf<A, B> = B extends Record<any, any> ? A & B : A
type DefaultVoid<T> = T extends Record<any, any> ? T : S.Void

type Extr<T> = T extends { Model: S.SchemaAny }
  ? T["Model"]
  : T extends S.SchemaAny
  ? T
  : never

type RT<T extends (...args: any) => any> = T extends (...args: any) => infer R
  ? R
  : unknown

export type ParsedShapeOf<X extends S.Schema<any, any, any, any, any, any, any>> = RT<
  X["_ParsedShape"]
>

// TODO: Response should defaults to S.Void
type RequestHandlers<R, E, M extends Requests> = {
  // TOdo; expose a ClientShape joining Path etc?
  [K in keyof M]: keyof (M[K]["Request"]["Path"] &
    M[K]["Request"]["Query"] &
    M[K]["Request"]["Body"]) extends never
    ? T.Effect<R, E, DefaultVoid<ParsedShapeOf<Extr<M[K]["Response"]>>>>
    : (
        req: JoinIf<
          InstanceType<M[K]["Request"]>,
          ParsedShapeOf<M[K]["Request"]["Path"]>
        >
      ) => T.Effect<R, E, DefaultVoid<ParsedShapeOf<Extr<M[K]["Response"]>>>> // TODO
} // TODO
