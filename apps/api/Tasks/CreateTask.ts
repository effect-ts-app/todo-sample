import { User } from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"

import { canAccessList } from "@/access"
import { UnauthorizedError } from "@/errors"

import * as TaskContext from "./TaskContext"
import { getLoggedInUser, handle } from "./shared"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import * as CreateTask from "@effect-ts-demo/todo-client/Tasks/CreateTask"

export default handle(CreateTask)(({ myDay, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(getLoggedInUser)

    if (_.listId !== "inbox") {
      const list = yield* $(TaskContext.getList(_.listId))
      if (!canAccessList(user.id)(list)) {
        yield* $(T.fail(new UnauthorizedError()))
      }
    }

    const task = user["|>"](User.createTask(_))
    yield* $(TaskContext.add(task))
    yield* $(
      pipe(
        EO.fromOption(myDay),
        EO.chainEffect((date) =>
          TaskContext.updateUser(user.id, User.addToMyDay(task, date))
        )
      )
    )

    return { id: task.id }
  })
)
