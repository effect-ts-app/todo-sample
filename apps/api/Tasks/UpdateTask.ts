import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/UpdateTask"
import { Task } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Lens } from "@effect-ts/monocle"

import * as TaskContext from "./TaskContext"

export const handle = (_: Request) =>
  pipe(
    TaskContext.find(_.id),
    T.chain(O.fold(() => T.die(`Did not find Task#${_.id}`), T.succeed)),
    T.map(
      Task.lens["|>"](Lens.props("completed", "steps", "title", "updatedAt")).set({
        ..._,
        updatedAt: new Date(),
      })
    ),
    T.tap(TaskContext.add),
    T.asUnit
  )

export { Request, Response }
