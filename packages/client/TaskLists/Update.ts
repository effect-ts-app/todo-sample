import { makeOptional, prop, Patch, namedC } from "@effect-ts-app/core/ext/Schema"
import { EditableTaskListProps, TaskListId } from "@effect-ts-demo/todo-types/"

@namedC()
export default class UpdateTaskList extends Patch("/lists/:id")<UpdateTaskList>()({
  id: prop(TaskListId),
  ...makeOptional(EditableTaskListProps),
}) {}
