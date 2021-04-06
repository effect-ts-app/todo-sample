import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { flow } from "@effect-ts/core/Function"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { decode } from "@effect-ts/morphic/Decoder"

import { fetchApi, fetchApi3, mapResponseError } from "../fetch"

import * as CreateTask from "./CreateTask"
import * as DeleteTask from "./DeleteTask"
import * as GetTask from "./GetTask"
import * as GetTasks from "./GetTasks"
import * as UpdateTask from "./UpdateTask"

const decodeGetTasksResponse = flow(decode(GetTasks.Response), mapResponseError)
export const getTasks = pipe(fetchApi("/tasks"), T.chain(decodeGetTasksResponse))

const decodeGetTaskResponse = flow(decode(GetTask.Response), mapResponseError)
export const findTask = (id: UUID) =>
  pipe(fetchApi(`/tasks/${id}`), T.chain(decodeGetTaskResponse))

export const createTask = fetchApi3(CreateTask)("/tasks")

const decodeCreateTaskRequest = decode(CreateTask.Request)
export const createTaskE = flow(decodeCreateTaskRequest, T.chain(createTask))

const update = fetchApi3(UpdateTask, "PATCH")
export function updateTask(req: UpdateTask.Request) {
  return update(`/tasks/${req.id}`)(req)
}

const del = fetchApi3(DeleteTask, "DELETE")
export function deleteTask(req: DeleteTask.Request) {
  return del(`/tasks/${req.id}`)(req)
}
