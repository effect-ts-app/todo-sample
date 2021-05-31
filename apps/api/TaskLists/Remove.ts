import * as T from "@effect-ts/core/Effect"
import { handle } from "@effect-ts-app/infra/app"
import { TaskLists } from "@effect-ts-demo/todo-client"

import { TodoContext, UserSVC } from "@/services"

import { ListAuth } from "./_access"

export default handle(TaskLists.Remove)((input) =>
  T.gen(function* ($) {
    const { Lists } = yield* $(TodoContext.TodoContext)

    const user = yield* $(UserSVC.UserProfile)
    const list = yield* $(Lists.get(input.id))

    return yield* $(ListAuth.accessM_(list, user.id, (tl) => Lists.remove(tl.id)))
  })
)
