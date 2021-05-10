import { Task, User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import { Lens } from "@effect-ts/monocle"

import * as TaskContext from "./TaskContext"
import { handle } from "./shared"

import { UserSVC } from "@effect-ts-demo/infra/services"
import * as UpdateTask from "@effect-ts-demo/todo-client/Tasks/UpdateTask"

export default handle(UpdateTask)(({ id, myDay, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)

    const task = yield* $(
      TaskContext.update(
        id,
        Task.lens["|>"](
          Lens.modify((t) => ({
            ...t,
            ..._,
            updatedAt: new Date(),
          }))
        )
      )
    )
    if (myDay) {
      yield* $(TaskContext.updateUser(user.id, User.toggleMyDay(task, myDay)))
    }
  })
)
