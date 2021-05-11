import * as S from "@effect-ts-demo/core/ext/Schema"
import { EditableTaskListProps, TaskListId } from "@effect-ts-demo/todo-types/"

export class Request extends S.WriteRequest<Request>()("PATCH", "/lists/:id", {
  path: S.required({ id: TaskListId }),
  body: S.partial({ ...EditableTaskListProps }),
}) {}
