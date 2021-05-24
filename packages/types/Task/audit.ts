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

import { TaskId, UserId } from "../ids"
import { FileName } from "./shared"

export function AuditProps<T extends string>(tag: T) {
  return {
    _tag: prop(literal(tag)),
    id: defaultProp(UUID),
    createdAt: defaultProp(date),
    userId: prop(UserId),
  }
}

export function TaskAuditProps<T extends string>(tag: T) {
  return {
    _tag: prop(literal(tag)),
    id: defaultProp(UUID),
    createdAt: defaultProp(date),
    userId: prop(UserId),
    taskId: prop(TaskId),
  }
}

@namedC()
export class TaskCreated extends Model<TaskCreated>()({
  ...TaskAuditProps("TaskCreated"),
}) {}

@namedC()
export class TaskFileAdded extends Model<TaskCreated>()({
  ...TaskAuditProps("TaskFileAdded"),
  fileName: prop(FileName),
}) {}

@namedC()
export class TaskStepsAdded extends Model<TaskCreated>()({
  ...TaskAuditProps("TaskStepsAdded"),
  stepCount: prop(positiveInt),
}) {}

export const TaskAudit = union({ TaskCreated: TaskCreated.Model })
export type TaskAudit = ParsedShapeOf<typeof TaskAudit>
