import {
  date,
  defaultProp,
  literal,
  Model,
  namedC,
  ParsedShapeOf,
  partialConstructor_,
  positiveInt,
  prop,
  union,
  UUID,
} from "@effect-ts-app/core/ext/Schema"
import { reverseCurriedMagix } from "@effect-ts-app/core/ext/utils"

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

@namedC()
export class TaskCreated extends Model<TaskCreated>()({
  ...AuditProps("TaskCreated"),
}) {}

@namedC()
export class TaskFileAdded extends Model<TaskFileAdded>()({
  ...AuditProps("TaskFileAdded"),
  fileName: prop(FileName),
}) {
  static fromAttachment = reverseCurriedMagix((a: Attachment) =>
    partialConstructor_(TaskFileAdded, { fileName: a.fileName })
  )
}

@namedC()
export class TaskStepsAdded extends Model<TaskStepsAdded>()({
  ...AuditProps("TaskStepsAdded"),
  stepCount: prop(positiveInt),
}) {}

export const TaskAudit = union({
  TaskCreated,
  TaskFileAdded,
})
export type TaskAudit = ParsedShapeOf<typeof TaskAudit>
