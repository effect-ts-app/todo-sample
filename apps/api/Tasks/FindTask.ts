import { User } from "@effect-ts-demo/todo-types/"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeTask, getLoggedInUser, handle } from "./shared"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { identity, pipe } from "@effect-ts-demo/core/ext/Function"
import * as FindTask from "@effect-ts-demo/todo-client/Tasks/FindTask"

export default handle(FindTask)((_) =>
  EO.gen(function* ($) {
    const task = yield* $(TaskContext.find(_.id))
    const { user } = yield* $(
      pipe(
        T.do,
        T.bind("user", () => getLoggedInUser),
        T.bind("taskLists", ({ user }) => TaskContext.allTaskLists(user.id)),
        T.tap(({ taskLists, user }) =>
          authorizeTask(taskLists).authorize_(task, user.id, identity)
        ),
        EO.fromEffect
      )
    )

    return {
      ...task,
      myDay: user["|>"](User.getMyDay(task)),
    }
  })
)
