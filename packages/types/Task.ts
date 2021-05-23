import * as O from "@effect-ts/core/Option"
import * as Lens from "@effect-ts/monocle/Lens"
import { constant } from "@effect-ts/system/Function"
import {
  array,
  bool,
  date,
  defaultProp,
  include,
  longString,
  makeOptional,
  Model,
  namedC,
  nullable,
  ParsedShapeOf,
  prop,
  props,
  reasonableString,
  withDefault,
} from "@effect-ts-app/core/ext/Schema"

import { TaskId, TaskListIdU, UserId } from "./ids"

@namedC()
export class Step extends Model<Step>()({
  title: prop(reasonableString),
  completed: defaultProp(bool),
}) {
  static complete = Lens.id<Step>()["|>"](Lens.prop("completed")).set(true)
}

export const EditableTaskProps = {
  title: prop(reasonableString),
  completed: prop(nullable(date)),
  isFavorite: prop(bool),

  due: prop(nullable(date)),
  reminder: prop(nullable(date)),
  note: prop(nullable(longString)),
  steps: prop(array(Step.Model)),
  assignedTo: prop(nullable(UserId)),
}

export const OptionalEditableTaskProps = props(makeOptional(EditableTaskProps))
export type OptionalEditableTaskProps = ParsedShapeOf<typeof OptionalEditableTaskProps>

export const EditablePersonalTaskProps = {
  myDay: prop(nullable(date)),
}

export const OptionalEditablePersonalTaskProps = props(
  makeOptional(EditablePersonalTaskProps)
)
export type OptionalEditablePersonalTaskProps = ParsedShapeOf<
  typeof OptionalEditablePersonalTaskProps
>

export class Task extends Model<Task>()({
  id: defaultProp(TaskId),
  createdBy: prop(UserId),
  listId: defaultProp(TaskListIdU, constant("inbox" as const)),
  createdAt: defaultProp(date),
  updatedAt: defaultProp(date),
  ...include(EditableTaskProps)(
    ({ assignedTo, completed, due, isFavorite, note, reminder, steps, ...rest }) => ({
      ...rest,
      assignedTo: assignedTo["|>"](withDefault),
      completed: completed["|>"](withDefault),
      due: due["|>"](withDefault),
      note: note["|>"](withDefault),
      reminder: reminder["|>"](withDefault),
      isFavorite: isFavorite["|>"](withDefault),
      steps: steps["|>"](withDefault),
    })
  ),
}) {
  static complete = Lens.id<Task>()
    ["|>"](Lens.prop("completed"))
    .set(O.some(new Date()))
}
