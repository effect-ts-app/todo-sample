import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListId, TaskId } from "@effect-ts-demo/todo-types"

export class Request extends S.ReadRequest<Request>()("GET", "/me", {}) {}

export class TaskListEntryBase extends S.Model<TaskListEntryBase>()(
  S.required({
    id: TaskListId,
    order: S.array(TaskId),
  })
) {}

@S.namedC
export class TaskListEntry extends S.Model<TaskListEntry>()(
  TaskListEntryBase.Model["|>"](
    S.intersect(
      S.required({
        title: S.nonEmptyString,
        parentListId: S.nullable(TaskListId),
      })
    )
  )["|>"](S.tag("TaskList"))
) {}

// TaskListEntryGroups contains tasklists
@S.namedC
export class TaskListEntryGroup extends S.Model<TaskListEntryGroup>()(
  S.required({
    id: TaskListId,
    title: S.nonEmptyString,
    lists: S.array(TaskListId),
  })["|>"](S.tag("TaskListGroup"))
) {}

export const TaskListEntryOrGroup = S.tagged(
  TaskListEntry.Model,
  TaskListEntryGroup.Model
)["|>"](S.named("TaskListEntryOrGroup"))
export type TaskListEntryOrGroup = S.ParsedShapeOf<typeof TaskListEntryOrGroup>

export class Response extends S.Model<Response>()(
  S.required({
    name: S.nonEmptyString,
    inboxOrder: S.array(TaskId),
    lists: S.array(TaskListEntryOrGroup),
  })["|>"](S.named("Me"))
) {}
