import { SharableTaskList, TaskListOrGroup, User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import * as Lens from "@effect-ts/monocle/Lens"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/SetTasksOrder"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)

    if (_.listId === "inbox") {
      yield* $(
        TaskContext.updateUser(
          u.id,
          User.lens["|>"](Lens.prop("inboxOrder")).set(_.order)
        )
      )
      return
    }
    yield* $(
      TaskContext.updateList(
        _.listId,
        TaskListOrGroup.match({
          TaskList: SharableTaskList.lens["|>"](Lens.prop("order")).set(_.order),
          TaskListGroup: (l) => l,
        })
      )
    )
  })

export { Request, Response }
