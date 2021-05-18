import {
  array,
  literal,
  Model,
  namedC,
  ParsedShapeOf,
  union,
  prop,
  include,
  withDefault,
  defaultProp,
  reasonableString,
} from "@effect-ts-app/core/ext/Schema"

import { TaskId, TaskListId, UserId } from "./ids"

@namedC()
export class Membership extends Model<Membership>()({
  id: prop(UserId),
  name: prop(reasonableString),
}) {}

export const EditableTaskListProps = {
  title: prop(reasonableString),
}

@namedC()
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

@namedC()
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
  TaskList: TaskList.Model,
  TaskListGroup: TaskListGroup.Model,
})
export type TaskListOrGroup = ParsedShapeOf<typeof TaskListOrGroup>
