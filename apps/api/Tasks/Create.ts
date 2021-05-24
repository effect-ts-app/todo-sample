import * as T from "@effect-ts/core/Effect"
import { identity } from "@effect-ts/system/Function"
import { tuple } from "@effect-ts-app/core/ext/Function"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { TaskEvents, User } from "@effect-ts-demo/todo-types"

import { TodoContext } from "@/services"

import { TaskListAuth } from "../TaskLists/_access"

export default handle(Tasks.Create)((_) =>
  T.gen(function* ($) {
    const { Lists, Tasks } = yield* $(TodoContext.TodoContext)

    const user = yield* $(TodoContext.getLoggedInUser)

    if (_.listId !== "inbox") {
      const list = yield* $(Lists.getList(_.listId))
      yield* $(TaskListAuth.access_(list, user.id, identity))
    }

    const [task, events] = createTask_(user, _)
    yield* $(Tasks.save(task, events))

    return { id: task.id }
  })
)

function createTask_(user: User, _: Tasks.Create.default) {
  const task = User.createTask_(user, _)
  return tuple(
    task,
    tuple(
      new TaskEvents.TaskCreated({ taskId: task.id, myDay: _.myDay, userId: user.id })
    )
  )
}
