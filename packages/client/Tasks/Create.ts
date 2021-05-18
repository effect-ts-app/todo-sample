import {
  date,
  include,
  Model,
  nullable,
  prop,
  Post,
  namedC,
} from "@effect-ts-app/core/ext/Schema"
import { TaskId, Task } from "@effect-ts-demo/todo-types"

@namedC()
export default class CreateTask extends Post("/tasks")<CreateTask>()({
  ...include(Task.Model.Api.props)(({ isFavorite, listId, title }) => ({
    listId,
    title,
    isFavorite,
  })),
  myDay: prop(nullable(date)),
}) {}

//export class NotMe {}

export class Response extends Model<Response>()({ id: prop(TaskId) }) {}
