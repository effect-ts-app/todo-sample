import * as S from "@effect-ts-demo/core/ext/Schema"
import { EditableTaskListGroupProps, TaskListId } from "@effect-ts-demo/todo-types"

export class Request extends S.WriteRequest<Request>()("PATCH", "/groups/:id", {
  path: S.props({ id: S.prop(TaskListId) }),
  body: S.props({ ...S.makeOptional(EditableTaskListGroupProps) }),
}) {}
