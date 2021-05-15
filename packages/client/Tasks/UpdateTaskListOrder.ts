import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskId, TaskListIdU } from "@effect-ts-demo/todo-types"

export class Request extends S.WriteRequest<Request>()("POST", "/lists/:id/order", {
  path: S.props({ id: S.prop(TaskListIdU) }),
  body: S.props({ order: S.prop(S.array(TaskId)) }),
}) {}
