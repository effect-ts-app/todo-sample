import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/DeleteTask"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"

import * as TaskContext from "./TaskContext"

export const handle = (_: Request) =>
  pipe(TaskContext.get(_.id), T.chain(TaskContext.remove), T.asUnit)

export { Request, Response }
