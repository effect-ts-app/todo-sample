import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTasks"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const items = yield* $(TaskContext.allOrdered)

    return {
      items,
    }
  })

export { Request, Response }
