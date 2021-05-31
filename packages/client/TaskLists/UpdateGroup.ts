import { makeOptional, namedC, Patch, prop } from "@effect-ts-app/core/Schema"
import { EditableTaskListGroupProps, TaskListId } from "@effect-ts-demo/todo-types"

@namedC
export default class UpdateTaskListGroup extends Patch(
  "/groups/:id"
)<UpdateTaskListGroup>()({
  id: prop(TaskListId),
  ...makeOptional(EditableTaskListGroupProps),
}) {}
