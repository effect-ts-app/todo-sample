import * as S from "@effect-ts-demo/core/ext/Schema"
import {
  EditablePersonalTaskProps,
  EditableTaskProps,
  TaskId,
} from "@effect-ts-demo/todo-types"

export class Request extends S.WriteRequest<Request>()("PATCH", "/tasks/:id", {
  path: S.required({ id: TaskId }),
  body: S.partial({
    ...EditableTaskProps,
    ...EditablePersonalTaskProps,
  }),
}) {}
