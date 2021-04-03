import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/CreateTask"
import { Task } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"

export const handle = (_: Request) =>
  T.succeed(Task.create({ ..._, steps: [] }))
    ["|>"](T.tap(TaskContext.add))
    ["|>"](T.map((t) => ({ id: t.id })))

export { Request, Response }
