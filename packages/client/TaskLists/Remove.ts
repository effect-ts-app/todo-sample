import { Delete, prop, useClassNameForSchema } from "@effect-ts-app/core/Schema"
import { TaskListId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export default class RemoveTaskList extends Delete("/lists/:id")<RemoveTaskList>()({
  id: prop(TaskListId),
}) {}
