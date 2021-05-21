import * as T from "@effect-ts/core/Effect"
import { identity } from "@effect-ts/system/Function"
import * as EO from "@effect-ts-app/core/ext/EffectOption"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { User } from "@effect-ts-demo/todo-types"

import { TodoContext } from "@/services"

import { TaskListAuth } from "../TaskLists/_access"

export default handle(Tasks.Create)(({ myDay, ..._ }) =>
  T.gen(function* ($) {
    const { Lists, Tasks, Users } = yield* $(TodoContext.TodoContext)

    const user = yield* $(TodoContext.getLoggedInUser)

    if (_.listId !== "inbox") {
      const list = yield* $(Lists.getList(_.listId))
      yield* $(TaskListAuth.access_(list, user.id, identity))
    }

    const task = User.createTask_(user, _)
    yield* $(
      T.tuplePar(
        Tasks.add(task),
        EO.genUnit(function* ($) {
          yield* $(Users.update(user.id, User.addToMyDay(task, yield* $(myDay))))
        })
      )
    )

    return { id: task.id }
  })
)
