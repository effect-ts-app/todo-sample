import { handle } from "@effect-ts-app/infra/app"
import { UserSVC } from "@effect-ts-app/infra/services"
import { Tasks } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import { authorizeTask } from "@/access"
import { TodoContext } from "@/services"

export default handle(Tasks.Remove)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const task = yield* $(TodoContext.get(_.id))
    const taskLists = yield* $(TodoContext.allTaskLists(user.id))

    return yield* $(
      authorizeTask(taskLists).authorizeM_(task, user.id, (t) =>
        TodoContext.remove(t.id)
      )
    )
  })
)
