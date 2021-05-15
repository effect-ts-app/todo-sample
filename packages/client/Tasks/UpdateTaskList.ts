import {
  makeOptional,
  prop,
  props,
  WriteRequest,
} from "@effect-ts-demo/core/ext/Schema"
import { EditableTaskListProps, TaskListId } from "@effect-ts-demo/todo-types/"

export class Request extends WriteRequest<Request>()("PATCH", "/lists/:id", {
  path: props({ id: prop(TaskListId) }),
  body: props({ ...makeOptional(EditableTaskListProps) }),
}) {}
