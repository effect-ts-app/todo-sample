import { Delete, prop, useClassNameForSchema } from "@effect-ts-app/core/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export default class RemoveTask extends Delete("/tasks/:id")<RemoveTask>()({
  id: prop(TaskId),
}) {}
