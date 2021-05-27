import * as T from "@effect-ts/core/Effect"
import { handle } from "@effect-ts-app/infra/app"
import { TaskLists } from "@effect-ts-demo/todo-client"
import { TaskList, User } from "@effect-ts-demo/todo-types"

import { TodoContext, UserSVC } from "@/services"

import { TaskListAuth } from "./_access"

export default handle(TaskLists.UpdateOrder)((_) =>
  T.gen(function* ($) {
    const { Lists, Users } = yield* $(TodoContext.TodoContext)
    const user = yield* $(UserSVC.UserProfile)

    if (_.id === "inbox") {
      yield* $(Users.update(user.id, User.lenses.inboxOrder.set(_.order)))
      return
    }
    yield* $(
      Lists.updateListM(
        _.id,
        TaskListAuth.access(user.id, TaskList.lenses.order.set(_.order))
      )
    )
  })
)
