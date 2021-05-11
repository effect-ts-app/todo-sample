import * as S from "@effect-ts-demo/core/ext/Schema"
import { EditableTaskListGroupProps, TaskListId } from "@effect-ts-demo/todo-types"

export class Request extends S.WriteRequest<Request>()("PATCH", "/groups/:id", {
  path: S.required({ id: TaskListId }),
  body: S.partial({ ...EditableTaskListGroupProps }),
}) {}
