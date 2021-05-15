import {
  makeOptional,
  prop,
  props,
  WriteRequest,
} from "@effect-ts-demo/core/ext/Schema"
import {
  EditablePersonalTaskProps,
  EditableTaskProps,
  TaskId,
} from "@effect-ts-demo/todo-types"

export class Request extends WriteRequest<Request>()("PATCH", "/tasks/:id", {
  path: props({ id: prop(TaskId) }),
  body: props({
    ...makeOptional(EditableTaskProps),
    ...makeOptional(EditablePersonalTaskProps),
  }),
}) {}
