import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { flow } from "@effect-ts/core/Function"
import { tag } from "@effect-ts/core/Has"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { decode, Errors } from "@effect-ts/morphic/Decoder"
import { encode } from "@effect-ts/morphic/Encoder"
import * as Layer from "@effect-ts/system/Layer"
import fetch from "cross-fetch"

import * as CreateTask from "./CreateTask"
import * as DeleteTask from "./DeleteTask"
import * as GetTask from "./GetTask"
import * as GetTasks from "./GetTasks"
import * as UpdateTask from "./UpdateTask"

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
        fetch(`${apiUrl}${path}`, {
          headers: { "Content-Type": "application/json", ...options?.headers },
          ...options,
        }).then((r) =>
          r.status === 204
            ? undefined
            : // unknown is better than any, as it demands to handle the unknown value
              (r.json() as Promise<unknown>)
        ),
      (err) => new FetchError(err)
    )
  )
}

const decodeGetTasksResponse = flow(decode(GetTasks.Response), mapResponseError)
export const getTasks = pipe(fetchApi("/tasks"), T.chain(decodeGetTasksResponse))

const decodeGetTaskResponse = flow(decode(GetTask.Response), mapResponseError)
export const findTask = (id: UUID) =>
  pipe(fetchApi(`/tasks/${id}`), T.chain(decodeGetTaskResponse))

const encodeCreateTaskRequest = encode(CreateTask.Request)
const decodeCreateTaskResponse = flow(decode(CreateTask.Response), mapResponseError)
export function createTask(req: CreateTask.Request) {
  return pipe(
    encodeCreateTaskRequest(req),
    T.chain((res) =>
      fetchApi("/tasks", {
        method: "POST",
        body: JSON.stringify(res),
      })
    ),
    T.chain(decodeCreateTaskResponse)
  )
}

const decodeCreateTaskRequest = decode(CreateTask.Request)
export const createTaskE = flow(decodeCreateTaskRequest, T.chain(createTask))

const encodeUpdateTaskRequest = encode(UpdateTask.Request)
export function updateTask(req: UpdateTask.Request) {
  return pipe(
    encodeUpdateTaskRequest(req),
    T.chain((res) =>
      fetchApi(`/tasks/${req.id}`, {
        method: "POST",
        body: JSON.stringify(res),
      })
    )
  )
}

const decodeUpdateTaskRequest = decode(UpdateTask.Request)
export const updateTaskE = flow(decodeUpdateTaskRequest, T.chain(updateTask))

export function deleteTask(req: DeleteTask.Request) {
  return fetchApi(`/tasks/${req.id}`, {
    method: "DELETE",
  })
}
