import {
  makeOptional,
  Patch,
  prop,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"
import { EditableTaskListGroupProps, TaskListId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export class UpdateTaskListGroupRequest extends Patch(
  "/groups/:id"
)<UpdateTaskListGroupRequest>()({
  id: prop(TaskListId),
  ...makeOptional(EditableTaskListGroupProps),
}) {}
