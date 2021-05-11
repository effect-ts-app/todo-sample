import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListId } from "@effect-ts-demo/todo-types/Task"

export class Request extends S.WriteRequest<Request>()("DELETE", "/lists/:id", {
  path: S.required({ id: TaskListId }),
}) {}
