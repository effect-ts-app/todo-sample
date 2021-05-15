import { prop, props, WriteRequest } from "@effect-ts-demo/core/ext/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

export class Request extends WriteRequest<Request>()("DELETE", "/tasks/:id", {
  path: props({ id: prop(TaskId) }),
}) {}
