import { WriteRequest, props, prop } from "@effect-ts-demo/core/ext/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types/"

export class Request extends WriteRequest<Request>()("POST", "/lists/:id/members", {
  path: props({ id: prop(TaskListId) }),
  body: props({ memberId: prop(UserId) }),
}) {}
