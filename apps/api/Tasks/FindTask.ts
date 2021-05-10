import { User } from "@effect-ts-demo/todo-types/"

import * as TaskContext from "./TaskContext"
import { getLoggedInUser, handle } from "./shared"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import * as FindTask from "@effect-ts-demo/todo-client/Tasks/FindTask"

export default handle(FindTask)((_) =>
  EO.gen(function* ($) {
    const user = yield* $(getLoggedInUser["|>"](EO.fromEffect))
    const task = yield* $(TaskContext.find(_.id))
    // TODO: Authorization
    return {
      ...task,
      myDay: user["|>"](User.getMyDay(task)),
    }
  })
)
