import { UserSVC } from "@effect-ts-app/infra/services"
import { Tasks } from "@effect-ts-demo/todo-client"
import { User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"

import { TodoContext } from "@/services"
import { authorizeTask, handle } from "@/shared"

export default handle(Tasks.Update)(({ id, myDay, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const taskLists = yield* $(TodoContext.allTaskLists(user.id))

    const task = yield* $(
      TodoContext.updateM(
        id,
        authorizeTask(taskLists).authorize(user.id, (tl) => ({
          ...tl,
          ..._,
          updatedAt: new Date(),
        }))
      )
    )
    if (myDay) {
      yield* $(TodoContext.updateUser(user.id, User.toggleMyDay(task, myDay)))
    }
  })
)
