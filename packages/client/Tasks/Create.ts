import { include, Model, namedC, Post, prop } from "@effect-ts-app/core/ext/Schema"
import { MyDay, Task, TaskId } from "@effect-ts-demo/todo-types"

@namedC()
export default class CreateTask extends Post("/tasks")<CreateTask>()({
  ...include(Task.Model.Api.props)(({ isFavorite, listId, title }) => ({
    listId,
    title,
    isFavorite,
  })),
  myDay: prop(MyDay),
}) {}

export class Response extends Model<Response>()({ id: prop(TaskId) }) {}
