import { array, Model, prop, Get, metaC, namedC } from "@effect-ts-demo/core/ext/Schema"

import { TaskView } from "./views"

@namedC()
export default class GetTasks extends Get("/tasks")<GetTasks>()() {}

@metaC({ description: "A list of Tasks" })
export class Response extends Model<Response>()({
  items: prop(array(TaskView.Model)),
}) {}
