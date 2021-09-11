import * as T from "@effect-ts-app/core/Effect"
import {
  date,
  literal,
  Model,
  optionFromNull,
  ParsedShapeOf,
  prop,
  union,
} from "@effect-ts-app/core/Schema"

import { TaskId, UserId } from "../ids"
import { OptionalEditablePersonalTaskProps, OptionalEditableTaskProps } from "./Task"

export function DomainEventProps<T extends string>(tag: T) {
  return {
    _tag: prop(literal(tag)),
  }
}

export class TaskCreated extends Model<TaskCreated>()({
  ...DomainEventProps("TaskCreated"),
  taskId: prop(TaskId),
  userId: prop(UserId),
  myDay: prop(optionFromNull(date)),
}) {}

export class TaskUpdated extends Model<TaskUpdated>()({
  ...DomainEventProps("TaskUpdated"),
  taskId: prop(TaskId),
  userId: prop(UserId),
  changes: prop(OptionalEditableTaskProps),
  userChanges: prop(OptionalEditablePersonalTaskProps),
}) {}

const Events_ = union({
  TaskCreated,
  TaskUpdated,
})

export const Events = Object.assign(Events_, {
  matchOne: <
    Key extends keyof Parameters<typeof Events_.Api.matchW>[0],
    Evt extends Extract<Events, { _tag: Key }>,
    R,
    E,
    A
  >(
    key: Key,
    hndlr: (evt: Evt) => T.Effect<R, E, A>
  ) => Events_.matchW({ [key]: hndlr }, () => T.unit),
})
export type Events = ParsedShapeOf<typeof Events_>
