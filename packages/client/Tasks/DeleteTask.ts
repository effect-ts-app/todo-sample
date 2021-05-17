import { prop, Delete, namedC } from "@effect-ts-demo/core/ext/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

@namedC()
export default class DeleteTask extends Delete("/tasks/:id")<DeleteTask>()({
  id: prop(TaskId),
}) {}
