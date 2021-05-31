import { makeOptional, namedC, Patch, prop } from "@effect-ts-app/core/Schema"
import { EditableTaskListProps, TaskListId } from "@effect-ts-demo/todo-types"

@namedC
export default class UpdateTaskList extends Patch("/lists/:id")<UpdateTaskList>()({
  id: prop(TaskListId),
  ...makeOptional(EditableTaskListProps),
}) {}
