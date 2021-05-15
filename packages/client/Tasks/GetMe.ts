import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListId, TaskId } from "@effect-ts-demo/todo-types"

export class Request extends S.ReadRequest<Request>()("GET", "/me", {}) {}

const TaskListEntryProps = S.props({
  id: S.prop(TaskListId),
  order: S.prop(S.array(TaskId)),
})

@S.namedC
export class TaskListEntry extends S.Model<TaskListEntry>()(
  S.props({
    _tag: S.prop(S.literal("TaskList")),
    title: S.prop(S.nonEmptyString),
    parentListId: S.prop(S.nullable(TaskListId)),
    ...TaskListEntryProps.props,
  })
) {}

// TaskListEntryGroups contains tasklists
@S.namedC
export class TaskListEntryGroup extends S.Model<TaskListEntryGroup>()(
  S.props({
    _tag: S.prop(S.literal("TaskListGroup")),
    id: S.prop(TaskListId),
    title: S.prop(S.nonEmptyString),
    lists: S.prop(S.array(TaskListId)),
  })
) {}

export const TaskListEntryOrGroup = S.union({
  TaskList: TaskListEntry.Model,
  TaskListGroup: TaskListEntryGroup.Model,
})["|>"](S.named("TaskListEntryOrGroup"))
export type TaskListEntryOrGroup = S.ParsedShapeOf<typeof TaskListEntryOrGroup>

export class Response extends S.Model<Response>()(
  S.props({
    name: S.prop(S.nonEmptyString),
    inboxOrder: S.prop(S.array(TaskId)),
    lists: S.prop(S.array(TaskListEntryOrGroup)),
  })["|>"](S.named("Me"))
) {}
