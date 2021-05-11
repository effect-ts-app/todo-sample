export * from "./config"
import { flow, pipe } from "@effect-ts-demo/core/ext/Function"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { typedKeysOf } from "@effect-ts-demo/core/ext/utils"
import * as T from "@effect-ts/core/Effect"
import { Has } from "@effect-ts/core/Has"
import { Path } from "path-parser"

import * as Ts from "./Tasks/_index"
import { ApiConfig } from "./config"
import {
  fetchApi,
  fetchApi3S,
  FetchError,
  mapResponseErrorS,
  ResponseError,
} from "./fetch"

// TODO: Path and Method
// TODO: Global headers? ie missing X-user-Id atm due to middleware on server side.
type Requests = Record<string, { Request: any; Response?: any }>

function clientFor<M extends Requests>(models: M) {
  return typedKeysOf(models).reduce((prev, cur) => {
    const h = models[cur]
    const p = new Path(h.Request.path)
    const res = h.Response ?? S.Void
    // todo; automatically determine if need a request input etc
    // auto determine if need headers? ie via: { input: (body/query), headers: Z } or as separate arguments ?
    // @ts-expect-error
    prev[cur] =
      h.Request.method === "GET"
        ? (req) =>
            pipe(
              fetchApi(p.build(req)),
              T.chain(
                // @ts-expect-error
                flow(
                  (res.Parser ?? S.Parser.for(res))["|>"](S.condemnFail),
                  // @ts-expect-error
                  mapResponseErrorS
                )
              )
            )
        : (req) => fetchApi3S(h, h.Request.method)(p.build(req))(req) // generate handler

    return prev
  }, {} as RequestHandlers<Has<ApiConfig>, FetchError | ResponseError, M>)
}

type JoinIf<A, B> = B extends Record<any, any> ? A & B : A
type DefaultVoid<T> = T extends Record<any, any> ? T : S.Void

type Extr<T> = T extends { Model: S.SchemaAny }
  ? T["Model"]
  : T extends S.SchemaAny
  ? T
  : never

// TODO: Response should defaults to S.Void
type RequestHandlers<R, E, M extends Requests> = {
  // TOdo; expose a ClientShape joining Path etc?
  [K in keyof M]: (
    req: JoinIf<InstanceType<M[K]["Request"]>, S.ParsedShapeOf<M[K]["Request"]["Path"]>>
  ) => T.Effect<R, E, DefaultVoid<S.ParsedShapeOf<Extr<M[K]["Response"]>>>> // TODO
} // TODO

export const TasksClient = clientFor(Ts)
export * as Tasks from "./Tasks/_index"

// TasksClient.DeleteTask
// TasksClient.CreateTask
// TasksClient.FindTask
// TasksClient.GetTasks({})
//   ["|>"](T.provideSomeLayer(LiveApiConfig({ apiUrl: "http://localhost:3330" })))
//   ["|>"](T.delay(2000))
//   ["|>"](T.result)
//   ["|>"](T.runPromise)
//   .then((x) => console.warn(JSON.stringify(x, undefined, 2)))
