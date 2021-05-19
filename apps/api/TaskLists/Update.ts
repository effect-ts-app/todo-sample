import { handle } from "@effect-ts-app/infra/app"
import { TaskLists } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import { TodoContext, UserSVC } from "@/services"

import { TaskListAuth } from "./_access"

export default handle(TaskLists.Update)(({ id, ..._ }) =>
  T.gen(function* ($) {
    const { Lists } = yield* $(TodoContext.TodoContext)

    const user = yield* $(UserSVC.UserEnv)
    yield* $(
      Lists.updateListM(
        id,
        TaskListAuth.access(user.id, (g) => ({
          ...g,
          ..._,
        }))
      )
    )
  })
)
