import * as T from "@effect-ts/core/Effect"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTasks"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)
    const items = yield* $(TaskContext.allOrdered(u.id))

    return {
      items,
    }
  })

export { Request, Response }
