import {
  array,
  defaultProp,
  include,
  literal,
  Model,
  ParsedShapeOf,
  prop,
  ReasonableString,
  union,
  useClassNameForSchema,
  withDefault,
} from "@effect-ts-app/core/Schema"

import { TaskId, TaskListId, UserId } from "./ids"
import type { User } from "./User"

@useClassNameForSchema
export class Membership extends Model<Membership>()({
  id: prop(UserId),
  name: prop(ReasonableString),
}) {
  static fromUser(user: User) {
    return new Membership({ id: user.id, name: user.name })
  }
}

export const EditableTaskListProps = {
  title: prop(ReasonableString),
}

@useClassNameForSchema
export class TaskList extends Model<TaskList>()({
  _tag: prop(literal("TaskList")),
  id: defaultProp(TaskListId),
  ...EditableTaskListProps,
  order: defaultProp(array(TaskId)),

  members: defaultProp(array(Membership.Model)),
  ownerId: prop(UserId),
}) {}

export const EditableTaskListGroupProps = {
  title: prop(ReasonableString),
  lists: prop(array(TaskListId)),
}

@useClassNameForSchema
export class TaskListGroup extends Model<TaskListGroup>()({
  _tag: prop(literal("TaskListGroup")),
  id: defaultProp(TaskListId),
  ...include(EditableTaskListGroupProps)(({ lists, ...rest }) => ({
    ...rest,
    lists: lists["|>"](withDefault),
  })),

  ownerId: prop(UserId),
}) {}

export const TaskListOrGroup = union({
  TaskList,
  TaskListGroup,
})
export type TaskListOrGroup = ParsedShapeOf<typeof TaskListOrGroup>
