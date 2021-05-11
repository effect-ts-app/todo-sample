import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListIdU, TaskId } from "@effect-ts-demo/todo-types"

export class Request extends S.WriteRequest<Request>()("POST", "/tasks", {
  body: S.required({
    listId: TaskListIdU,
    title: S.nonEmptyString,
    isFavorite: S.bool,
    myDay: S.nullable(S.date),
  }),
}) {}

export class Response extends S.Model<Response>()(S.required({ id: TaskId })) {}
