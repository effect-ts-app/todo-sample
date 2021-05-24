import { Model, ParsedShapeOf, prop, union } from "@effect-ts-app/core/ext/Schema"

import { TaskId, UserId } from "../ids"
import { MyDay } from "./Task"

export class TaskCreated extends Model<TaskCreated>()({
  taskId: prop(TaskId),
  userId: prop(UserId),
  myDay: prop(MyDay),
}) {}

export const Events = union({ TaskCreated: TaskCreated.Model })
export type Events = ParsedShapeOf<typeof Events>
