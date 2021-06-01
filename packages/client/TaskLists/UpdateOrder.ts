import { array, Post, prop, useClassNameForSchema } from "@effect-ts-app/core/Schema"
import { TaskId, TaskListIdU } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export default class UpdateTaskListOrder extends Post(
  "/lists/:id/order"
)<UpdateTaskListOrder>()({
  id: prop(TaskListIdU),
  order: prop(array(TaskId)),
}) {}
