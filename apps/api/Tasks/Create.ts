import * as EO from "@effect-ts-app/core/ext/EffectOption"
import { Tasks } from "@effect-ts-demo/todo-client"
import { User } from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { identity } from "@effect-ts/system/Function"

import { TodoContext } from "@/services"
import { authorizeTaskList, getLoggedInUser, handle } from "@/shared"

export default handle(Tasks.Create)(({ myDay, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(getLoggedInUser)

    if (_.listId !== "inbox") {
      const list = yield* $(TodoContext.getTaskList(_.listId))
      yield* $(authorizeTaskList.authorize_(list, user.id, identity))
    }

    const task = User.createTask_(user, _)
    yield* $(TodoContext.add(task))
    yield* $(
      pipe(
        EO.fromOption(myDay),
        EO.chainEffect((date) =>
          TodoContext.updateUser(user.id, User.addToMyDay(task, date))
        )
      )
    )

    return { id: task.id }
  })
)
