import * as EO from "@effect-ts-app/core/ext/EffectOption"
import { handle } from "@effect-ts-app/infra/app"
import { TaskLists } from "@effect-ts-demo/todo-client"
import { User } from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { identity } from "@effect-ts/system/Function"

import { TodoContext } from "@/services"

import { TaskListAuth } from "./access"

export default handle(TaskLists.CreateTask)(({ myDay, ..._ }) =>
  T.gen(function* ($) {
    const { Lists, Tasks, Users } = yield* $(TodoContext.TodoContext)

    const user = yield* $(TodoContext.getLoggedInUser)

    if (_.listId !== "inbox") {
      const list = yield* $(Lists.getList(_.listId))
      yield* $(TaskListAuth.access_(list, user.id, identity))
    }

    const task = User.createTask_(user, _)
    yield* $(Tasks.add(task))
    yield* $(
      pipe(
        EO.fromOption(myDay),
        EO.chainEffect((date) => Users.update(user.id, User.addToMyDay(task, date)))
      )
    )

    return { id: task.id }
  })
)
