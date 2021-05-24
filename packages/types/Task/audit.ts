import { LazyGetter } from "@effect-ts/core/Utils"
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
import { reverseCurry } from "@effect-ts-app/core/ext/utils"

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
  static fromAttachmentR = (a: Attachment) =>
    partialConstructor_(TaskFileAdded, { fileName: a.fileName })

  @LazyGetter()
  static get fromAttachment() {
    return reverseCurry(TaskFileAdded.fromAttachmentR)
  }
}

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
