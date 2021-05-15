import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types/"

export class Request extends S.WriteRequest<Request>()(
  "DELETE",
  "/lists/:id/members/:memberId",
  {
    path: S.props({ id: S.prop(TaskListId), memberId: S.prop(UserId) }),
  }
) {}
