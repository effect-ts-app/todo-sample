import {
  array,
  Get,
  metaC,
  Model,
  prop,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"

import { TaskView } from "./views"

@useClassNameForSchema
export class GetTasksRequest extends Get("/tasks")<GetTasksRequest>()() {}

@metaC({ description: "A list of Tasks" })
export class Response extends Model<Response>()({
  items: prop(array(TaskView.Model)),
}) {}
