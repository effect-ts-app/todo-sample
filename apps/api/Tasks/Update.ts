import * as T from "@effect-ts/core/Effect"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { OptionalEditableTaskProps, Task, User } from "@effect-ts-demo/todo-types"

import { TodoContext, UserSVC } from "@/services"

import { TaskAuth } from "./_access"

export default handle(Tasks.Update)(({ id, myDay, ..._ }) =>
  T.gen(function* ($) {
    const { Lists, Tasks, Users } = yield* $(TodoContext.TodoContext)

    const user = yield* $(UserSVC.UserProfile)
    const taskLists = yield* $(Lists.allLists(user.id))
    const task = yield* $(
      Tasks.updateM(id, TaskAuth(taskLists).access(user.id, updateTask(_)))
    )
    if (myDay) {
      yield* $(Users.update(user.id, User.toggleMyDay(task, myDay)))
    }
  })
)

export function updateTask(_: OptionalEditableTaskProps) {
  return (t: Task) => ({
    ...t,
    ..._,
    updatedAt: new Date(),
  })
}
