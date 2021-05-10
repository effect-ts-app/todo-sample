import { Parser } from "@effect-ts-demo/core/ext/Schema"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { flow } from "@effect-ts/core/Function"

import { fetchApi, fetchApi3S, mapResponseErrorS } from "../fetch"

import * as CreateTask from "./CreateTask"
import * as DeleteTask from "./DeleteTask"
import * as FindTask from "./FindTask"
import * as GetMe from "./GetMe"
import * as GetTasks from "./GetTasks"
import * as SetTasksOrder from "./SetTasksOrder"
import * as UpdateTask from "./UpdateTask"
import * as UpdateTaskListGroup from "./UpdateTaskListGroup"

export { CreateTask, DeleteTask, GetMe, FindTask, GetTasks, SetTasksOrder, UpdateTask }

export { TaskView as Task } from "./views"
export * from "@effect-ts-demo/todo-types"

export const getMe = pipe(
  fetchApi("/me"),
  T.chain(flow(GetMe.Response.Parser["|>"](S.condemnFail), mapResponseErrorS))
)
export const getTasks = pipe(
  fetchApi("/tasks"),
  T.chain(flow(GetTasks.Response.Parser["|>"](S.condemnFail), mapResponseErrorS))
)

const decodeGetTaskResponse = flow(
  Parser.for(FindTask.Response)["|>"](S.condemn),
  mapResponseErrorS
)
export const findTask = (id: S.UUID) =>
  pipe(fetchApi(`/tasks/${id}`), T.chain(decodeGetTaskResponse))

export const createTask = fetchApi3S(CreateTask)("/tasks")

const parseCreateTaskRequest = (i: S.EncodedOf<typeof CreateTask.Request["Model"]>) =>
  CreateTask.Request.Parser["|>"](S.condemn)(i)["|>"](T.orDie)
export const createTaskE = flow(parseCreateTaskRequest, T.chain(createTask))

const update = fetchApi3S(UpdateTask, "PATCH")
export function updateTask(req: UpdateTask.Request) {
  return update(`/tasks/${req.id}`)(req)
}

const del = fetchApi3S(DeleteTask, "DELETE")
export function deleteTask(req: DeleteTask.Request) {
  return del(`/tasks/${req.id}`)(req)
}

export const setTasksOrder = fetchApi3S(SetTasksOrder, "POST")(`/tasks-order`)

const updateG = fetchApi3S(UpdateTaskListGroup, "PATCH")
export function updateGroup(req: UpdateTaskListGroup.Request) {
  return updateG(`/groups/${req.id}`)(req)
}
