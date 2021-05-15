import * as S from "@effect-ts-demo/core/ext/Schema"
import { EditableTaskListProps, TaskListId } from "@effect-ts-demo/todo-types/"

export class Request extends S.WriteRequest<Request>()("PATCH", "/lists/:id", {
  path: S.props({ id: S.prop(TaskListId) }),
  body: S.props({ ...S.makeOptional(EditableTaskListProps) }),
}) {}
