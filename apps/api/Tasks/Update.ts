import { flow, identity } from "@effect-ts/core/Function"
import * as T from "@effect-ts-app/core/ext/Effect"
import * as O from "@effect-ts-app/core/ext/Option"
import { typedKeysOf } from "@effect-ts-app/core/ext/utils"
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

    const initialUser = yield* $(TodoContext.getLoggedInUser)
    const taskLists = yield* $(Lists.allLists(initialUser.id))
    const initialTask = yield* $(Tasks.get(id))
    yield* $(TaskAuth(taskLists).access_(initialTask, initialUser.id, identity))
    const [task, user] = updateTask(_, myDay)(initialTask, initialUser)

    // TODO: Context should perhaps know if changed, and should use a transaction
    yield* $(
      T.tuple(
        Tasks.save["|>"](T.ifDiff(task, initialTask)),
        Users.save["|>"](T.ifDiff(user, initialUser))
      )
    )
  })
)

export function updateTask(_: OptionalEditableTaskProps, myDay?: MyDay) {
  return (task: Task, user: User) => updateTask_(task, user, _, myDay)
}

export function updateTask_(
  task: Task,
  user: User,
  _: OptionalEditableTaskProps,
  myDay?: MyDay
) {
  if (typedKeysOf(_).some((x) => typeof _[x] !== "undefined")) {
    task = task["|>"](Task.update(_))
    // Derive audits.
    // NOTE: Obviously it would be easier if this was a Task Based approach, where each change would be specialised, instead of allowing to change all the editable props
    // TODO: As adding an attachment is actually a special purpose use case, we should extract it to it's own use case + route.
    if (_.attachment) {
      task = _.attachment["|>"](
        O.fold(
          // TODO: Attachment removed?
          () => task,
          flow(
            TaskAudits.TaskFileAdded.fromAttachment({ userId: user.id }),
            Task.addAudit.r(task)
          )
        )
      )
    }
  }
  if (myDay) {
    user = user["|>"](User.toggleMyDay(task, myDay))
  }

  return [task, user] as const
}
