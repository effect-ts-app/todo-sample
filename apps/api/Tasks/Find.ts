import * as EO from "@effect-ts-app/core/ext/EffectOption"
import { identity } from "@effect-ts-app/core/ext/Function"
import { Tasks } from "@effect-ts-demo/todo-client"
import { Task, User } from "@effect-ts-demo/todo-types/"
import * as T from "@effect-ts/core/Effect"

import { TodoContext } from "@/services"
import { authorizeTask, getLoggedInUser, handle } from "@/shared"

export default handle(Tasks.Find)((_) =>
  EO.gen(function* ($) {
    const task = yield* $(TodoContext.find(_.id))
    const user = yield* $(getUserAndAuthorise(task)["|>"](EO.fromEffect))
    return {
      ...task,
      myDay: user["|>"](User.getMyDay(task)),
    }
  })
)

function getUserAndAuthorise(task: Task) {
  return T.gen(function* ($) {
    const user = yield* $(getLoggedInUser)
    const taskLists = yield* $(TodoContext.allTaskLists(user.id))
    yield* $(authorizeTask(taskLists).authorize_(task, user.id, identity))
    return user
  })
}
