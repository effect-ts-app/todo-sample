import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types/"

export class Request extends S.WriteRequest<Request>()("POST", "/lists/:id/members", {
  path: S.required({ id: TaskListId }),
  body: S.required({ memberId: UserId }),
}) {}
