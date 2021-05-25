import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"

import { TodoContext } from "@/services"

import { personaliseTask } from "./Find"

export default handle(Tasks.All)((_) =>
  T.gen(function* ($) {
    const user = yield* $(TodoContext.getLoggedInUser)
    const tasks = yield* $(TodoContext.allTasks(user.id))

    const items = tasks["|>"](CNK.map(personaliseTask(user)))["|>"](CNK.toArray)

    return {
      items,
    }
  })
)
