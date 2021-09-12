import {
  makeOptional,
  Patch,
  prop,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"
import { EditableTaskListProps, TaskListId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export class UpdateTaskListRequest extends Patch("/lists/:id")<UpdateTaskListRequest>()(
  {
    id: prop(TaskListId),
    ...makeOptional(EditableTaskListProps),
  }
) {}
