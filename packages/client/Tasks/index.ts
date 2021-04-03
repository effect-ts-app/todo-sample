import * as GetTasks from "@effect-ts-demo/todo-client/Tasks/GetTasks"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { flow } from "@effect-ts/core/Function"
import { tag } from "@effect-ts/core/Has"
import { decoder, Errors } from "@effect-ts/morphic/Decoder"
import * as Layer from "@effect-ts/system/Layer"
import fetch from "cross-fetch"
//import { encoder } from "@effect-ts/morphic/Encoder"

export interface ApiConfig {
  api: string
}

export const ApiConfig = tag<ApiConfig>()

const getConfig = T.accessServiceM(ApiConfig)

export const LiveApiConfig = (config: ApiConfig) =>
  Layer.fromFunction(ApiConfig)(() => config)

class FetchError {
  public readonly _tag = "FetchError"
  constructor(public readonly error: unknown) {}
}

class ResponseError {
  public readonly _tag = "ResponseError"
  constructor(public readonly error: Errors) {}
}

const mapResponseError = T.mapError((err: Errors) => new ResponseError(err))

function fetchApi(path: string, options?: RequestInit) {
  return getConfig(({ api }) =>
    T.fromPromiseWith(
      () => fetch(`${api}${path}`, options).then((r) => r.json() as Promise<unknown>),
      (err) => new FetchError(err)
    )
  )
}

//const { encode } = encoder(GetTasks.Request)
const { decode: decodeGetTasksResponse } = decoder(GetTasks.Response)

export const getTasks = pipe(
  fetchApi("/tasks"),
  T.chain(flow(decodeGetTasksResponse, mapResponseError))
)
