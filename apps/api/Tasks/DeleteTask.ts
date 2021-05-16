import { UserSVC } from "@effect-ts-demo/infra/services"
import { Tasks } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeTask, handle } from "./shared"

export default handle(Tasks.DeleteTask)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const task = yield* $(TaskContext.get(_.id))
    const taskLists = yield* $(TaskContext.allTaskLists(user.id))

    return yield* $(
      authorizeTask(taskLists).authorizeM_(task, user.id, (t) =>
        TaskContext.delete(t.id)
      )
    )
  })
)
