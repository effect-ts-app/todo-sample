import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/DeleteTask"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"

import * as TaskContext from "./TaskContext"

export const handle = (_: Request) =>
  pipe(
    TaskContext.find(_.id),
    T.chain(O.fold(() => T.die(`Didnt find Task#${_.id}`), TaskContext.remove)),
    T.asUnit
  )

export { Request, Response }
