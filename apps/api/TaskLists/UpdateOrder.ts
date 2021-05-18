import { handle } from "@effect-ts-app/infra/app"
import { UserSVC } from "@effect-ts-app/infra/services"
import { TaskLists } from "@effect-ts-demo/todo-client"
import { TaskList, User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import * as Lens from "@effect-ts/monocle/Lens"

import { authorizeTaskList } from "@/access"
import { TodoContext } from "@/services"

const inboxOrder = User.lens["|>"](Lens.prop("inboxOrder"))
const order = TaskList.lens["|>"](Lens.prop("order"))

export default handle(TaskLists.UpdateOrder)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)

    if (_.id === "inbox") {
      yield* $(TodoContext.updateUser(user.id, inboxOrder.set(_.order)))
      return
    }
    yield* $(
      TodoContext.updateTaskListM(
        _.id,
        authorizeTaskList.authorize(user.id, order.set(_.order))
      )
    )
  })
)
