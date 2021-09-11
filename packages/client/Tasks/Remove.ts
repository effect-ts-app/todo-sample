import { Delete, prop, useClassNameForSchema } from "@effect-ts-app/core/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export class RemoveTaskRequest extends Delete("/tasks/:id")<RemoveTaskRequest>()({
  id: prop(TaskId),
}) {}
