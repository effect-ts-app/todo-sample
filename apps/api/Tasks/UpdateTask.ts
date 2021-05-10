import { User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeTask, handle } from "./shared"

import { UserSVC } from "@effect-ts-demo/infra/services"
import * as UpdateTask from "@effect-ts-demo/todo-client/Tasks/UpdateTask"

export default handle(UpdateTask)(({ id, myDay, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const taskLists = yield* $(TaskContext.allTaskLists(user.id))

    const task = yield* $(
      TaskContext.updateM(
        id,
        authorizeTask(taskLists).authorize(user.id, (t) => ({
          ...t,
          ..._,
          updatedAt: new Date(),
        }))
      )
    )
    if (myDay) {
      yield* $(TaskContext.updateUser(user.id, User.toggleMyDay(task, myDay)))
    }
  })
)
