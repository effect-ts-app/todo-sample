import {
  date,
  defaultProp,
  literal,
  Model,
  namedC,
  ParsedShapeOf,
  positiveInt,
  prop,
  union,
  UUID,
} from "@effect-ts-app/core/ext/Schema"

import { UserId } from "../ids"
import { FileName } from "./shared"

export function AuditProps<T extends string>(tag: T) {
  return {
    _tag: prop(literal(tag)),
    id: defaultProp(UUID),
    createdAt: defaultProp(date),
    userId: prop(UserId),
  }
}

@namedC()
export class TaskCreated extends Model<TaskCreated>()({
  ...AuditProps("TaskCreated"),
}) {}

@namedC()
export class TaskFileAdded extends Model<TaskFileAdded>()({
  ...AuditProps("TaskFileAdded"),
  fileName: prop(FileName),
}) {}

@namedC()
export class TaskStepsAdded extends Model<TaskStepsAdded>()({
  ...AuditProps("TaskStepsAdded"),
  stepCount: prop(positiveInt),
}) {}

export const TaskAudit = union({
  TaskCreated: TaskCreated.Model,
  TaskFileAdded: TaskFileAdded.Model,
})
export type TaskAudit = ParsedShapeOf<typeof TaskAudit>
