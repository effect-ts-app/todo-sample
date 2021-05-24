import * as T from "@effect-ts/core/Effect"
import { identity } from "@effect-ts/core/Function"
import * as O from "@effect-ts-app/core/ext/Option"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import {
  MyDay,
  OptionalEditableTaskProps,
  Task,
  TaskAudits,
  User,
} from "@effect-ts-demo/todo-types"

import { TodoContext } from "@/services"

import { TaskAuth } from "./_access"

export default handle(Tasks.Update)(({ id, myDay, ..._ }) =>
  T.gen(function* ($) {
    const { Lists, Tasks, Users } = yield* $(TodoContext.TodoContext)

    const user = yield* $(TodoContext.getLoggedInUser)
    const taskLists = yield* $(Lists.allLists(user.id))
    const task = yield* $(Tasks.get(id))
    yield* $(TaskAuth(taskLists).access_(task, user.id, identity))
    const [nt, nu] = updateTask(_, myDay)(task, user)

    // TODO: Context should perhaps know if changed.
    if (nt !== task) {
      yield* $(Tasks.save(nt))
    }
    if (nu !== user) {
      yield* $(Users.save(nu))
    }
  })
)

export function updateTask(_: OptionalEditableTaskProps, myDay?: MyDay) {
  return (t: Task, user: User) => updateTask_(t, user, _, myDay)
}

export function updateTask_(
  t: Task,
  user: User,
  _: OptionalEditableTaskProps,
  myDay?: MyDay
) {
  t = Task.update_(t, _)
  if (myDay) {
    user = user["|>"](User.toggleMyDay(t, myDay))
  }
  // Derive audits.
  // NOTE: Obviously it would be easier if this was a Task Based approach, where each change would be specialised, instead of allowing to change all the editable props
  // TODO: As adding an attachment is actually a special purpose use case, we should extract it to it's own use case + route.
  if (_.attachment) {
    t = _.attachment["|>"](
      O.fold(
        // TODO: Attachment removed?
        () => t,
        (a) =>
          t["|>"](
            Task.addAudit(
              TaskAudits.TaskFileAdded.fromAttachment(a)({ userId: user.id })
            )
          )
      )
    )
  }
  return [t, user] as const
}
