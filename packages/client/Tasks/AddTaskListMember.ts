import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types/"

export class Request extends S.WriteRequest<Request>()("POST", "/lists/:id/members", {
  path: S.props({ id: S.prop(TaskListId) }),
  body: S.props({ memberId: S.prop(UserId) }),
}) {}
