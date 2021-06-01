import {
  makeOptional,
  Patch,
  prop,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"
import { EditableTaskListProps, TaskListId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export default class UpdateTaskList extends Patch("/lists/:id")<UpdateTaskList>()({
  id: prop(TaskListId),
  ...makeOptional(EditableTaskListProps),
}) {}
