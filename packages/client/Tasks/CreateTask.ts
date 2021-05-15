import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListIdU, TaskId } from "@effect-ts-demo/todo-types"

export class Request extends S.WriteRequest<Request>()("POST", "/tasks", {
  body: S.props({
    listId: S.prop(TaskListIdU),
    title: S.prop(S.nonEmptyString),
    isFavorite: S.prop(S.bool),
    myDay: S.prop(S.nullable(S.date)),
  }),
}) {}

export class Response extends S.Model<Response>()(S.props({ id: S.prop(TaskId) })) {}
