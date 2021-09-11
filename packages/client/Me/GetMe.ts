import {
  array,
  Get,
  literal,
  Model,
  named,
  optionFromNull,
  ParsedShapeOf,
  prop,
  props,
  ReasonableString,
  union,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"
import { TaskId, TaskListId, User } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export class GetMeRequest extends Get("/me")<GetMeRequest>()() {}

const TaskListEntryProps = props({
  id: prop(TaskListId),
  order: prop(array(TaskId)),
})

@useClassNameForSchema
export class TaskListEntry extends Model<TaskListEntry>()({
  _tag: prop(literal("TaskList")),
  title: prop(ReasonableString),
  parentListId: prop(optionFromNull(TaskListId)),
  ...TaskListEntryProps.props,
}) {}

// TaskListEntryGroups contains tasklists
@useClassNameForSchema
export class TaskListEntryGroup extends Model<TaskListEntryGroup>()({
  _tag: prop(literal("TaskListGroup")),
  id: prop(TaskListId),
  title: prop(ReasonableString),
  lists: prop(array(TaskListId)),
}) {}

export const TaskListEntryOrGroup = union({
  TaskList: TaskListEntry,
  TaskListGroup: TaskListEntryGroup,
})["|>"](named("TaskListEntryOrGroup"))
export type TaskListEntryOrGroup = ParsedShapeOf<typeof TaskListEntryOrGroup>

export class Response extends Model<Response>("Me")({
  ...User.include(({ email, inboxOrder, name, phoneNumber }) => ({
    name,
    email,
    phoneNumber,
    inboxOrder,
  })),
  lists: prop(array(TaskListEntryOrGroup)),
}) {}
