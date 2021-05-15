import {
  array,
  Email,
  literal,
  Model,
  named,
  namedC,
  nonEmptyString,
  nullable,
  ParsedShapeOf,
  PhoneNumber,
  prop,
  props,
  ReadRequest,
  reasonableString,
  union,
} from "@effect-ts-demo/core/ext/Schema"
import { TaskListId, TaskId } from "@effect-ts-demo/todo-types"

export class Request extends ReadRequest<Request>()("GET", "/me", {}) {}

const TaskListEntryProps = props({
  id: prop(TaskListId),
  order: prop(array(TaskId)),
})

@namedC
export class TaskListEntry extends Model<TaskListEntry>()(
  props({
    _tag: prop(literal("TaskList")),
    title: prop(reasonableString),
    parentListId: prop(nullable(TaskListId)),
    ...TaskListEntryProps.props,
  })
) {}

// TaskListEntryGroups contains tasklists
@namedC
export class TaskListEntryGroup extends Model<TaskListEntryGroup>()(
  props({
    _tag: prop(literal("TaskListGroup")),
    id: prop(TaskListId),
    title: prop(reasonableString),
    lists: prop(array(TaskListId)),
  })
) {}

export const TaskListEntryOrGroup = union({
  TaskList: TaskListEntry.Model,
  TaskListGroup: TaskListEntryGroup.Model,
})["|>"](named("TaskListEntryOrGroup"))
export type TaskListEntryOrGroup = ParsedShapeOf<typeof TaskListEntryOrGroup>

export class Response extends Model<Response>()(
  props({
    name: prop(nonEmptyString),
    inboxOrder: prop(array(TaskId)),
    lists: prop(array(TaskListEntryOrGroup)),
    email: prop(Email),
    phoneNumber: prop(PhoneNumber),
  })["|>"](named("Me"))
) {}
