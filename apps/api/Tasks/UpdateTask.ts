import { Task } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import { Lens } from "@effect-ts/monocle"

import * as UserContext from "../Temp/UserContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/UpdateTask"

export const handle = (_: Request) =>
  pipe(
    UserContext.updateTask(
      _.id,
      Task.lens["|>"](
        Lens.modify((t) => ({
          ...t,
          ..._,
          updatedAt: new Date(),
        }))
      )
    ),
    T.asUnit
  )

export { Request, Response }
