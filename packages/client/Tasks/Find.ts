import {
  Get,
  namedC,
  nullable,
  ParsedShapeOf,
  prop,
} from "@effect-ts-app/core/ext/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

import { TaskView } from "./views"

@namedC
export default class FindTask extends Get("/tasks/:id")<FindTask>()({
  id: prop(TaskId),
}) {}

export const Response = nullable(TaskView.Model)
export type Response = ParsedShapeOf<typeof Response>
