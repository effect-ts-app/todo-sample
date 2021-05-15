import {
  makeOptional,
  prop,
  props,
  WriteRequest,
} from "@effect-ts-demo/core/ext/Schema"
import { EditableTaskListGroupProps, TaskListId } from "@effect-ts-demo/todo-types"

export class Request extends WriteRequest<Request>()("PATCH", "/groups/:id", {
  path: props({ id: prop(TaskListId) }),
  body: props({ ...makeOptional(EditableTaskListGroupProps) }),
}) {}
