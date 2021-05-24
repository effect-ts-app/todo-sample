import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts-app/core/ext/Option"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import {
  OptionalEditableTaskProps,
  Task,
  TaskAudits,
  User,
  UserId,
} from "@effect-ts-demo/todo-types"

import { TodoContext, UserSVC } from "@/services"

import { TaskAuth } from "./_access"

export default handle(Tasks.Update)(({ id, myDay, ..._ }) =>
  T.gen(function* ($) {
    const { Lists, Tasks, Users } = yield* $(TodoContext.TodoContext)

    const user = yield* $(UserSVC.UserProfile)
    const taskLists = yield* $(Lists.allLists(user.id))
    const task = yield* $(
      Tasks.updateM(id, TaskAuth(taskLists).access(user.id, updateTask(user.id, _)))
    )
    if (myDay) {
      yield* $(Users.update(user.id, User.toggleMyDay(task, myDay)))
    }
  })
)

export function updateTask(userId: UserId, _: OptionalEditableTaskProps) {
  return (t: Task) => updateTask_(t, userId, _)
}

export function updateTask_(t: Task, userId: UserId, _: OptionalEditableTaskProps) {
  const nt = Task.update_(t, _)
  // TODO: derive audits.
  // NOTE: Obviously it would be easier if this was a Task Based approach, where each change would be specialised, instead of allowing to change all the editable props

  if (_.attachment) {
    return _.attachment["|>"](
      O.fold(
        () => nt,
        (a) =>
          nt["|>"](
            Task.addAudit(
              new TaskAudits.TaskFileAdded({ userId, fileName: a.fileName })
            )
          )
      )
    )
  }
  return nt
}
