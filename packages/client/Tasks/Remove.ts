import { Delete, namedC, prop } from "@effect-ts-app/core/ext/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

@namedC
export default class RemoveTask extends Delete("/tasks/:id")<RemoveTask>()({
  id: prop(TaskId),
}) {}
