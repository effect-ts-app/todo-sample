import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTasks"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const tasks = yield* $(TaskContext.allOrdered)

    return {
      tasks,
    }
  })

export { Request, Response }
