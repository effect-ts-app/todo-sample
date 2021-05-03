import { Task } from "@effect-ts-demo/todo-types"
import { Lens } from "@effect-ts/monocle"

import * as TaskContext from "./TaskContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/UpdateTask"

export const handle = (_: Request) =>
  TaskContext.update(
    _.id,
    Task.lens["|>"](
      Lens.modify((t) => ({
        ...t,
        ..._,
        updatedAt: new Date(),
      }))
    )
  )

export { Request, Response }
