import { flow } from "@effect-ts/core/Function"
import * as T from "@effect-ts-app/core/Effect"
import * as O from "@effect-ts-app/core/Option"
import { typedKeysOf } from "@effect-ts-app/core/utils"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import {
  OptionalEditablePersonalTaskProps,
  OptionalEditableTaskProps,
  Task,
  TaskAudits,
  TaskEvents,
  UserId,
} from "@effect-ts-demo/todo-types"

import { TodoContext, UserSVC } from "@/services"

import { TaskAuth } from "./_access"

export default handle(Tasks.Update)(({ id, ..._ }) =>
  T.gen(function* ($) {
    const { Lists, Tasks } = yield* $(TodoContext.TodoContext)

    const user = yield* $(UserSVC.UserProfile)
    const taskLists = yield* $(Lists.allLists(user.id))
    const initialTask = yield* $(Tasks.get(id))

    const [task, events] = yield* $(
      TaskAuth(taskLists).access_(initialTask, user.id, updateTask(_, user.id))
    )

    // TODO: Context should perhaps know if changed, and should use a transaction
    yield* $(
      TodoContext.saveTaskAndPublishEvents(events)["|>"](T.ifDiff(task, initialTask))
    )
  })
)

export function updateTask(
  _: OptionalEditableTaskProps & OptionalEditablePersonalTaskProps,
  userId: UserId
) {
  return (task: Task) => updateTask_(task, userId, _)
}

export function updateTask_(
  task: Task,
  userId: UserId,
  {
    myDay,
    reminder,
    ..._
  }: OptionalEditableTaskProps & OptionalEditablePersonalTaskProps
) {
  const events: TaskEvents.Events[] = []
  const hasTaskChanges = typedKeysOf(_).some((x) => typeof _[x] !== "undefined")
  if (hasTaskChanges) {
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
            TaskAudits.TaskFileAdded.fromAttachment({ userId }),
            Task.addAudit.r(task)
          )
        )
      )
    }
  }

  const userChanges = { myDay, reminder }
  const hasUserChanges = typedKeysOf(userChanges).some(
    (x) => typeof userChanges[x] !== "undefined"
  )
  if (hasTaskChanges || hasUserChanges) {
    events.push(
      new TaskEvents.TaskUpdated({
        taskId: task.id,
        userId,
        changes: _,
        userChanges,
      })
    )
  }

  return [task, events] as const
}
