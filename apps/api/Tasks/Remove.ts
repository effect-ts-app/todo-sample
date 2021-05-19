import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import { TodoContext, UserSVC } from "@/services"

import { TaskAuth } from "./_access"

export default handle(Tasks.Remove)((_) =>
  T.gen(function* ($) {
    const { Lists, Tasks } = yield* $(TodoContext.TodoContext)

    const user = yield* $(UserSVC.UserEnv)
    const task = yield* $(Tasks.get(_.id))
    const taskLists = yield* $(Lists.allLists(user.id))

    return yield* $(
      TaskAuth(taskLists).accessM_(task, user.id, (t) => Tasks.remove(t.id))
    )
  })
)
