import * as S from "@effect-ts-demo/core/ext/Schema"
import { EditableTaskListGroupProps, TaskListId } from "@effect-ts-demo/todo-types"

export class Request extends S.WriteRequest<Request>()({
  path: S.required({ id: TaskListId }),
  body: S.partial({ ...EditableTaskListGroupProps }),
}) {}
