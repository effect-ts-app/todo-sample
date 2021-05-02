import * as T from "@effect-ts/core/Effect"

import { UserSVC } from "@/services"

import * as UserContext from "../Temp/UserContext"

import { NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import { Request, Response } from "@effect-ts-demo/todo-client/Temp/GetTaskList"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)
    const user = yield* $(UserContext.get(u.id))
    if (user.inbox.id === _.listId) {
      return {
        title: yield* $(NonEmptyString.decodeV_("Tasks")),
        items: user.inbox.tasks,
      }
    }
    const list = yield* $(UserContext.getTaskList(_.listId))
    // TODO: permissions

    return {
      title: list.title,
      items: list.tasks,
    }
  })

export { Request, Response }
