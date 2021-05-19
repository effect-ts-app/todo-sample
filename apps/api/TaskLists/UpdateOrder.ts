import { handle } from "@effect-ts-app/infra/app"
import { TaskLists } from "@effect-ts-demo/todo-client"
import { TaskList, User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import * as Lens from "@effect-ts/monocle/Lens"

import { TodoContext, UserSVC } from "@/services"

import { TaskListAuth } from "./access"

const inboxOrder = User.lens["|>"](Lens.prop("inboxOrder"))
const order = TaskList.lens["|>"](Lens.prop("order"))

export default handle(TaskLists.UpdateOrder)((_) =>
  T.gen(function* ($) {
    const { Lists, Users } = yield* $(TodoContext.TodoContext)
    const user = yield* $(UserSVC.UserEnv)

    if (_.id === "inbox") {
      yield* $(Users.update(user.id, inboxOrder.set(_.order)))
      return
    }
    yield* $(Lists.updateListM(_.id, TaskListAuth.access(user.id, order.set(_.order))))
  })
)
