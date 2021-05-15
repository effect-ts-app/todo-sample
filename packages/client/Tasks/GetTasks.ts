import { array, Model, prop, props, ReadRequest } from "@effect-ts-demo/core/ext/Schema"

import { TaskView } from "./views"

export class Request extends ReadRequest<Request>()("GET", "/tasks", {}) {}

export class Response extends Model<Response>()(
  props({ items: prop(array(TaskView.Model)) })
) {}
