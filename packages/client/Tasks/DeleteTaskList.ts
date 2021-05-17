import { prop, Delete, namedC } from "@effect-ts-demo/core/ext/Schema"
import { TaskListId } from "@effect-ts-demo/todo-types/Task"

@namedC()
export default class DeleteTaskList extends Delete("/lists/:id")<DeleteTaskList>()({
  id: prop(TaskListId),
}) {}
