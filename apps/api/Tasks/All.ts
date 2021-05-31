import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { User } from "@effect-ts-demo/todo-types/"

import { TodoContext } from "@/services"

export default handle(Tasks.All)(() =>
  T.gen(function* ($) {
    const user = yield* $(TodoContext.getLoggedInUser)
    const tasks = yield* $(TodoContext.allTasks(user.id))

    const items = tasks["|>"](CNK.map(User.personaliseTask.r(user)))["|>"](CNK.toArray)

    return {
      items,
    }
  })
)
