import {
  Get,
  optionFromNull,
  ParsedShapeOf,
  prop,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

import { TaskView } from "./views"

@useClassNameForSchema
export class FindTaskRequest extends Get("/tasks/:id")<FindTaskRequest>()({
  id: prop(TaskId),
}) {}

export const Response = optionFromNull(TaskView.Model)
export type Response = ParsedShapeOf<typeof Response>
