import * as T from "@effect-ts/core/Effect"

import { UserSVC } from "@/services"

import * as UserContext from "../Temp/UserContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTasks"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)
    const user = yield* $(UserContext.get(u.id))
    const items = user.taskList.tasks

    return {
      items,
    }
  })

export { Request, Response }
