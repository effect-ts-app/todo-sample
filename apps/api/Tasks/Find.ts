import * as EO from "@effect-ts-app/core/ext/EffectOption"
import { identity } from "@effect-ts-app/core/ext/Function"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { User } from "@effect-ts-demo/todo-types/"

import { authorizeTask } from "@/access"
import { TodoContext } from "@/services"

export default handle(Tasks.Find)((_) =>
  EO.gen(function* ($) {
    const task = yield* $(TodoContext.find(_.id))
    const user = yield* $(TodoContext.getLoggedInUser)
    const taskLists = yield* $(TodoContext.allTaskLists(user.id))
    yield* $(authorizeTask(taskLists).authorize_(task, user.id, identity))
    return {
      ...task,
      myDay: user["|>"](User.getMyDay(task)),
    }
  })
)
