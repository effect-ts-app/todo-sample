import * as GetTask from "@effect-ts-demo/todo-client/Tasks/GetTask"
import * as GetTasks from "@effect-ts-demo/todo-client/Tasks/GetTasks"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { flow } from "@effect-ts/core/Function"
import { tag } from "@effect-ts/core/Has"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { decode, Errors } from "@effect-ts/morphic/Decoder"
import * as Layer from "@effect-ts/system/Layer"
import fetch from "cross-fetch"

export interface ApiConfig {
  apiUrl: string
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
  return getConfig(({ apiUrl }) =>
    T.fromPromiseWith(
      () =>
        // unknown is better than any, as it demands to handle the unknown value
        fetch(`${apiUrl}${path}`, options).then((r) => r.json() as Promise<unknown>),
      (err) => new FetchError(err)
    )
  )
}

const decodeGetTasksResponse = flow(decode(GetTasks.Response), mapResponseError)
export const getTasks = pipe(fetchApi("/tasks"), T.chain(decodeGetTasksResponse))

const decodeGetTaskResponse = flow(decode(GetTask.Response), mapResponseError)
export const findTask = (id: UUID) =>
  pipe(fetchApi(`/tasks/${id}`), T.chain(decodeGetTaskResponse))
