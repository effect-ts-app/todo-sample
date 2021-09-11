import { identity } from "@effect-ts/system/Function"
import * as T from "@effect-ts-app/core/Effect"
import { pipe, tuple } from "@effect-ts-app/core/Function"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { TaskEvents, User } from "@effect-ts-demo/todo-types"

import { TodoContext } from "@/services"

import { TaskListAuth } from "../TaskLists/_access"

export default handle(Tasks.Create)((input) =>
  T.gen(function* ($) {
    const { Lists } = yield* $(TodoContext.TodoContext)

    const user = yield* $(TodoContext.getLoggedInUser)

    if (input.listId !== "inbox") {
      const list = yield* $(Lists.getList(input.listId))
      yield* $(TaskListAuth.access_(list, user.id, identity))
    }

    return yield* $(
      pipe(
        createTask_(user, input),
        T.tupleTap_(TodoContext.saveTaskAndPublishEvents._)
      )
    )
  })
)

export function createTask_(user: User, input: Tasks.Create.CreateTaskRequest) {
  const task = User.createTask._(user, input)

  return tuple(
    task,
    tuple(
      new TaskEvents.TaskCreated({
        taskId: task.id,
        myDay: input.myDay,
        userId: user.id,
      })
    )
  )
}
