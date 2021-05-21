import {
  array,
  Get,
  include,
  literal,
  Model,
  named,
  namedC,
  nullable,
  ParsedShapeOf,
  prop,
  props,
  reasonableString,
  union,
} from "@effect-ts-app/core/ext/Schema"
import { TaskId, TaskListId, User } from "@effect-ts-demo/todo-types"

@namedC()
export default class GetMe extends Get("/me")<GetMe>()() {}

const TaskListEntryProps = props({
  id: prop(TaskListId),
  order: prop(array(TaskId)),
})

@namedC()
export class TaskListEntry extends Model<TaskListEntry>()({
  _tag: prop(literal("TaskList")),
  title: prop(reasonableString),
  parentListId: prop(nullable(TaskListId)),
  ...TaskListEntryProps.props,
}) {}

// TaskListEntryGroups contains tasklists
@namedC()
export class TaskListEntryGroup extends Model<TaskListEntryGroup>()({
  _tag: prop(literal("TaskListGroup")),
  id: prop(TaskListId),
  title: prop(reasonableString),
  lists: prop(array(TaskListId)),
}) {}

export const TaskListEntryOrGroup = union({
  TaskList: TaskListEntry.Model,
  TaskListGroup: TaskListEntryGroup.Model,
})["|>"](named("TaskListEntryOrGroup"))
export type TaskListEntryOrGroup = ParsedShapeOf<typeof TaskListEntryOrGroup>

@namedC("Me")
export class Response extends Model<Response>()({
  ...include(User.Model.Api.props)(({ email, inboxOrder, name, phoneNumber }) => ({
    name,
    email,
    phoneNumber,
    inboxOrder,
  })),
  lists: prop(array(TaskListEntryOrGroup)),
}) {}
