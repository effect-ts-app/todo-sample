import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskId, TaskListIdU } from "@effect-ts-demo/todo-types"

export class Request extends S.WriteRequest<Request>()("POST", "/lists/:id/order", {
  path: S.required({ id: TaskListIdU }),
  body: S.required({ order: S.array(TaskId) }),
}) {}
