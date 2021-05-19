import * as EO from "@effect-ts-app/core/ext/EffectOption"
import { identity } from "@effect-ts-app/core/ext/Function"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { User } from "@effect-ts-demo/todo-types"

import { TodoContext } from "@/services"

import { TaskAuth } from "./access"

export default handle(Tasks.Find)((_) =>
  EO.gen(function* ($) {
    const { Lists, Tasks } = yield* $(TodoContext.TodoContext)

    const task = yield* $(Tasks.find(_.id))
    const user = yield* $(TodoContext.getLoggedInUser)
    const taskLists = yield* $(Lists.allLists(user.id))
    yield* $(TaskAuth(taskLists).access_(task, user.id, identity))
    return {
      ...task,
      myDay: user["|>"](User.getMyDay(task)),
    }
  })
)
