import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/DeleteTask"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import * as TaskContext from "./TaskContext"

export const handle = (_: Request) =>
  TaskContext.find(_.id)["|>"](
    T.chain(O.fold(() => T.die(`Didnt find Task#${_.id}`), TaskContext.remove))
  )

export { Request, Response }
