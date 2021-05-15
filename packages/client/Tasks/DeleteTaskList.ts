import { prop, props, WriteRequest } from "@effect-ts-demo/core/ext/Schema"
import { TaskListId } from "@effect-ts-demo/todo-types/Task"

export class Request extends WriteRequest<Request>()("DELETE", "/lists/:id", {
  path: props({ id: prop(TaskListId) }),
}) {}
