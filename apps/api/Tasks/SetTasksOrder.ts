import { TaskList, TaskListOrGroup, User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import * as Lens from "@effect-ts/monocle/Lens"

import * as TaskContext from "./TaskContext"
import { handle } from "./shared"

import { UUID } from "@effect-ts-demo/core/ext/Schema"
import { UserSVC } from "@effect-ts-demo/infra/services"
import * as SetTasksOrder from "@effect-ts-demo/todo-client/Tasks/SetTasksOrder"

const inboxOrder = User.lens["|>"](Lens.prop("inboxOrder"))
const order = TaskList.lens["|>"](Lens.prop("order"))

export default handle(SetTasksOrder)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)

    if (_.listId === "inbox") {
      yield* $(TaskContext.updateUser(user.id, inboxOrder.set(_.order)))
      return
    }
    yield* $(
      TaskContext.updateList(
        _.listId as UUID, // TODO
        TaskListOrGroup.Api.matchW({
          TaskList: order.set(_.order),
          TaskListGroup: (l) => l,
        })
      )
    )
  })
)
