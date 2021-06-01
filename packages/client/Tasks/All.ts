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
export default class GetTasks extends Get("/tasks")<GetTasks>()() {}

@metaC({ description: "A list of Tasks" })
export class Response extends Model<Response>()({
  items: prop(array(TaskView.Model)),
}) {}
