import { array, prop, props, WriteRequest } from "@effect-ts-demo/core/ext/Schema"
import { TaskId, TaskListIdU } from "@effect-ts-demo/todo-types"

export class Request extends WriteRequest<Request>()("POST", "/lists/:id/order", {
  path: props({ id: prop(TaskListIdU) }),
  body: props({ order: prop(array(TaskId)) }),
}) {}
