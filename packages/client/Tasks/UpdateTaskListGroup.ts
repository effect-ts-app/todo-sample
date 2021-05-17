import { makeOptional, prop, Patch, namedC } from "@effect-ts-demo/core/ext/Schema"
import { EditableTaskListGroupProps, TaskListId } from "@effect-ts-demo/todo-types"

@namedC()
export default class UpdateTaskListGroup extends Patch(
  "/groups/:id"
)<UpdateTaskListGroup>()({
  id: prop(TaskListId),
  ...makeOptional(EditableTaskListGroupProps),
}) {}
