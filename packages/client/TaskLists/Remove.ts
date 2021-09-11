import { Delete, prop, useClassNameForSchema } from "@effect-ts-app/core/Schema"
import { TaskListId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export class RemoveTaskListRequest extends Delete("/lists/:id")<RemoveTaskListRequest>()({
  id: prop(TaskListId),
}) {}
