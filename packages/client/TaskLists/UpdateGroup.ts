import {
  makeOptional,
  Patch,
  prop,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"
import { EditableTaskListGroupProps, TaskListId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export default class UpdateTaskListGroup extends Patch(
  "/groups/:id"
)<UpdateTaskListGroup>()({
  id: prop(TaskListId),
  ...makeOptional(EditableTaskListGroupProps),
}) {}
