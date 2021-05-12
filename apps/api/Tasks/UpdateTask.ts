import { Tasks } from "@effect-ts-demo/todo-client"
import { User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeTask, handle } from "./shared"

import { UserSVC } from "@effect-ts-demo/infra/services"

export default handle(Tasks.UpdateTask)(({ id, myDay, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const taskLists = yield* $(TaskContext.allTaskLists(user.sub))

    const task = yield* $(
      TaskContext.updateM(
        id,
        authorizeTask(taskLists).authorize(user.sub, (t) => ({
          ...t,
          ..._,
          updatedAt: new Date(),
        }))
      )
    )
    if (myDay) {
      yield* $(TaskContext.updateUser(user.sub, User.toggleMyDay(task, myDay)))
    }
  })
)
