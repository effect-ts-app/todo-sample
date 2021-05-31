import {
  array,
  defaultProp,
  include,
  literal,
  Model,
  namedC,
  ParsedShapeOf,
  prop,
  reasonableString,
  union,
  withDefault,
} from "@effect-ts-app/core/Schema"

import { TaskId, TaskListId, UserId } from "./ids"
import type { User } from "./User"

@namedC
export class Membership extends Model<Membership>()({
  id: prop(UserId),
  name: prop(reasonableString),
}) {
  static fromUser(user: User) {
    return new Membership({ id: user.id, name: user.name })
  }
}

export const EditableTaskListProps = {
  title: prop(reasonableString),
}

@namedC
export class TaskList extends Model<TaskList>()({
  _tag: prop(literal("TaskList")),
  id: defaultProp(TaskListId),
  ...EditableTaskListProps,
  order: defaultProp(array(TaskId)),

  members: defaultProp(array(Membership.Model)),
  ownerId: prop(UserId),
}) {}

export const EditableTaskListGroupProps = {
  title: prop(reasonableString),
  lists: prop(array(TaskListId)),
}

@namedC
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
