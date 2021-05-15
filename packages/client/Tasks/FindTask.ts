import {
  nullable,
  ParsedShapeOf,
  prop,
  props,
  ReadRequest,
} from "@effect-ts-demo/core/ext/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

import { TaskView } from "./views"

export class Request extends ReadRequest<Request>()("GET", "/tasks/:id", {
  path: props({ id: prop(TaskId) }),
}) {}

export const Response = nullable(TaskView.Model)
export type Response = ParsedShapeOf<typeof Response>
