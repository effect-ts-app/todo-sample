import { array, namedC, Post, prop } from "@effect-ts-app/core/ext/Schema"
import { TaskId, TaskListIdU } from "@effect-ts-demo/todo-types"

@namedC()
export default class UpdateTaskListOrder extends Post(
  "/lists/:id/order"
)<UpdateTaskListOrder>()({
  id: prop(TaskListIdU),
  order: prop(array(TaskId)),
}) {}
