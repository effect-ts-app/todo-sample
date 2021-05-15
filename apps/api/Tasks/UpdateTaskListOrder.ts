import { UserSVC } from "@effect-ts-demo/infra/services"
import { Tasks } from "@effect-ts-demo/todo-client"
import { TaskList, User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import * as Lens from "@effect-ts/monocle/Lens"

import * as TaskContext from "./TaskContext"
import { authorizeTaskList, handle } from "./shared"

const inboxOrder = User.lens["|>"](Lens.prop("inboxOrder"))
const order = TaskList.lens["|>"](Lens.prop("order"))

export default handle(Tasks.UpdateTaskListOrder)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)

    if (_.id === "inbox") {
      yield* $(TaskContext.updateUser(user.id, inboxOrder.set(_.order)))
      return
    }
    yield* $(
      TaskContext.updateTaskListM(
        _.id,
        authorizeTaskList.authorize(user.id, order.set(_.order))
      )
    )
  })
)
