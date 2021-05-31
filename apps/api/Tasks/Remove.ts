import * as T from "@effect-ts/core/Effect"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"

import { TodoContext, UserSVC } from "@/services"

import { TaskAuth } from "./_access"

export default handle(Tasks.Remove)(({ id }) =>
  T.gen(function* ($) {
    const { Lists, Tasks } = yield* $(TodoContext.TodoContext)

    const user = yield* $(UserSVC.UserProfile)
    const task = yield* $(Tasks.get(id))
    const taskLists = yield* $(Lists.allLists(user.id))

    // TODO: Remove customisations from every User..
    // probably should introduce a UserTask obj?
    return yield* $(
      TaskAuth(taskLists).accessM_(task, user.id, (t) => Tasks.remove(t.id))
    )
  })
)
