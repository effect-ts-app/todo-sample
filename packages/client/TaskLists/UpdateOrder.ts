import { array, Post, prop, useClassNameForSchema } from "@effect-ts-app/core/Schema"
import { TaskId, TaskListIdU } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export class UpdateTaskListOrderRequest extends Post(
  "/lists/:id/order"
)<UpdateTaskListOrderRequest>()({
  id: prop(TaskListIdU),
  order: prop(array(TaskId)),
}) {}
