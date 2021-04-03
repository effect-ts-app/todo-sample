import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/CreateTask"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"

import { Task } from "@/../../packages/types"

export const handle = (_: Request) =>
  T.succeed(Task.create({ ..._, steps: [] }))
    ["|>"](T.tap(TaskContext.add))
    ["|>"](T.map((t) => ({ id: t.id })))

export { Request, Response }
