import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/UpdateTask"
import { Task } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import { Lens } from "@effect-ts/monocle"

import * as TaskContext from "./TaskContext"

export const handle = (_: Request) =>
  pipe(
    TaskContext.get(_.id),
    T.map(
      Task.lens["|>"](Lens.props("completed", "steps", "title", "updatedAt"))["|>"](
        Lens.modify((t) => ({
          ...t,
          ..._,
          updatedAt: new Date(),
        }))
      )
    ),
    T.tap(TaskContext.add),
    T.asUnit
  )

export { Request, Response }
