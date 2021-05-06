import { SharableTaskList, TaskListOrGroup, User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import * as Lens from "@effect-ts/monocle/Lens"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/SetTasksOrder"

const inboxOrder = User.lens["|>"](Lens.prop("inboxOrder"))
const order = SharableTaskList.lens["|>"](Lens.prop("order"))

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)

    if (_.listId === "inbox") {
      yield* $(TaskContext.updateUser(user.id, inboxOrder.set(_.order)))
      return
    }
    yield* $(
      TaskContext.updateList(
        _.listId,
        TaskListOrGroup.match({
          TaskList: order.set(_.order),
          TaskListGroup: (l) => l,
        })
      )
    )
  })

export { Request, Response }
