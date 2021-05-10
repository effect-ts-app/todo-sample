import { User } from "@effect-ts-demo/todo-types/"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeTask, getLoggedInUser, handle } from "./shared"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { identity } from "@effect-ts-demo/core/ext/Function"
import * as FindTask from "@effect-ts-demo/todo-client/Tasks/FindTask"

export default handle(FindTask)((_) =>
  EO.gen(function* ($) {
    const task = yield* $(TaskContext.find(_.id))
    const { user } = yield* $(
      T.gen(function* ($) {
        const user = yield* $(getLoggedInUser)
        const taskLists = yield* $(TaskContext.allTaskLists(user.id))
        yield* $(authorizeTask(taskLists).authorize_(task, user.id, identity))
        return { user }
      })["|>"](EO.fromEffect)
    )
    return {
      ...task,
      myDay: user["|>"](User.getMyDay(task)),
    }
  })
)
