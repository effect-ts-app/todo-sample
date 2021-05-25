import { identity } from "@effect-ts/system/Function"
import * as T from "@effect-ts-app/core/ext/Effect"
import { pipe, tuple } from "@effect-ts-app/core/ext/Function"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { TaskEvents, User } from "@effect-ts-demo/todo-types"

import { TodoContext } from "@/services"

import { TaskListAuth } from "../TaskLists/_access"

export default handle(Tasks.Create)((_) =>
  T.gen(function* ($) {
    const { Lists } = yield* $(TodoContext.TodoContext)

    const user = yield* $(TodoContext.getLoggedInUser)

    if (_.listId !== "inbox") {
      const list = yield* $(Lists.getList(_.listId))
      yield* $(TaskListAuth.access_(list, user.id, identity))
    }

    return yield* $(
      pipe(createTask_(user, _), T.tupleTap_(TodoContext.saveTaskAndPublishEvents._))
    )
  })
)

export function createTask_(user: User, _: Tasks.Create.default) {
  const task = User.createTask._(user, _)

  return tuple(
    task,
    tuple(
      new TaskEvents.TaskCreated({ taskId: task.id, myDay: _.myDay, userId: user.id })
    )
  )
}
