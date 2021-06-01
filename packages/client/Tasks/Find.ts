import {
  Get,
  nullable,
  ParsedShapeOf,
  prop,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

import { TaskView } from "./views"

@useClassNameForSchema
export default class FindTask extends Get("/tasks/:id")<FindTask>()({
  id: prop(TaskId),
}) {}

export const Response = nullable(TaskView.Model)
export type Response = ParsedShapeOf<typeof Response>
