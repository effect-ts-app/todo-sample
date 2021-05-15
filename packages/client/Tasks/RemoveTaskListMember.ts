import { prop, props, WriteRequest } from "@effect-ts-demo/core/ext/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types/"

export class Request extends WriteRequest<Request>()(
  "DELETE",
  "/lists/:id/members/:memberId",
  {
    path: props({ id: prop(TaskListId), memberId: prop(UserId) }),
  }
) {}
