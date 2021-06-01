import {
  date,
  defaultProp,
  literal,
  Model,
  ParsedShapeOf,
  partialConstructor_,
  positiveInt,
  prop,
  union,
  useClassNameForSchema,
  UUID,
} from "@effect-ts-app/core/Schema"
import { reverseCurriedMagix } from "@effect-ts-app/core/utils"

import { UserId } from "../ids"
import { Attachment, FileName } from "./shared"

export function AuditProps<T extends string>(tag: T) {
  return {
    _tag: prop(literal(tag)),
    id: defaultProp(UUID),
    createdAt: defaultProp(date),
    userId: prop(UserId),
  }
}

@useClassNameForSchema
export class TaskCreated extends Model<TaskCreated>()({
  ...AuditProps("TaskCreated"),
}) {}

@useClassNameForSchema
export class TaskFileAdded extends Model<TaskFileAdded>()({
  ...AuditProps("TaskFileAdded"),
  fileName: prop(FileName),
}) {
  static fromAttachment = reverseCurriedMagix((a: Attachment) =>
    partialConstructor_(TaskFileAdded, { fileName: a.fileName })
  )
}

@useClassNameForSchema
export class TaskStepsAdded extends Model<TaskStepsAdded>()({
  ...AuditProps("TaskStepsAdded"),
  stepCount: prop(positiveInt),
}) {}

export const TaskAudit = union({
  TaskCreated,
  TaskFileAdded,
})
export type TaskAudit = ParsedShapeOf<typeof TaskAudit>
