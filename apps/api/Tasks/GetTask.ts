import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTask"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const task = yield* $(TaskContext.find(_.id))
    return task
  })

export { Request, Response }
