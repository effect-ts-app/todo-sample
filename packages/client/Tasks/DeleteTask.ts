import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

export class Request extends S.WriteRequest<Request>()("DELETE", "/tasks/:id", {
  path: S.required({ id: TaskId }),
}) {}
