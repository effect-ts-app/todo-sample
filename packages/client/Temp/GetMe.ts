import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListId, TaskId } from "@effect-ts-demo/todo-types"

// Must end up in openapi, but not in Request.
export class RequestHeaders extends S.Model<RequestHeaders>()(
  S.required({ "x-user-id": S.nonEmptyString })
) {}

export class Request extends S.Model<Request>()(S.required({})) {
  static Headers = RequestHeaders
}

@S.namedC
export class TaskListEntry extends S.Model<TaskListEntry>()(
  S.required({
    id: TaskListId,
    order: S.array(TaskId),
  })["|>"](S.asBuilder)
) {}

@S.namedC
export class SharableTaskListEntry extends S.Model<SharableTaskListEntry>()(
  S.intersect(TaskListEntry.Model)(
    S.required({
      title: S.nonEmptyString,
      parentListId: S.nullable(TaskListId),
    })
  )
    ["|>"](S.tag("TaskList"))
    ["|>"](S.asBuilder)
) {}

// TaskListEntryGroups contains tasklists
@S.namedC
export class TaskListEntryGroup extends S.Model<SharableTaskListEntry>()(
  S.required({
    id: TaskListId,
    title: S.nonEmptyString,
  })
    ["|>"](S.tag("TaskListGroup"))
    ["|>"](S.asBuilder)
) {}

export const TaskListEntryOrGroup = S.tagged(
  SharableTaskListEntry.Model,
  TaskListEntryGroup.Model
)["|>"](S.named("TaskListEntryOrGroup"))
export type TaskListEntryOrGroup = S.ParsedShapeOf<typeof TaskListEntryOrGroup>

export const Response = S.required({
  name: S.nonEmptyString,
  inboxOrder: S.array(TaskId),
  lists: S.array(TaskListEntryOrGroup),
})
export type Response = S.ParsedShapeOf<typeof Response>
