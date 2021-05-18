import {
  literal,
  nonEmptyString,
  ParsedShapeOf,
  union,
  UUID,
} from "@effect-ts-app/core/ext/Schema"
export const UserId = nonEmptyString
export type UserId = ParsedShapeOf<typeof UserId>

export const TaskId = UUID
export type TaskId = ParsedShapeOf<typeof TaskId>

export const InboxTaskList = literal("inbox")
export const TaskListId = UUID
export type TaskListId = ParsedShapeOf<typeof TaskListId>

export const TaskListIdU = union({ TaskListId, InboxTaskList })
export type TaskListIdU = ParsedShapeOf<typeof TaskListIdU>
