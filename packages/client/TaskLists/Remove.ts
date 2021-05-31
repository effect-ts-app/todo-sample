import { Delete, namedC, prop } from "@effect-ts-app/core/Schema"
import { TaskListId } from "@effect-ts-demo/todo-types"

@namedC
export default class RemoveTaskList extends Delete("/lists/:id")<RemoveTaskList>()({
  id: prop(TaskListId),
}) {}
