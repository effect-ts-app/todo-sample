import {
  bool,
  date,
  Model,
  nullable,
  prop,
  props,
  WriteRequest,
} from "@effect-ts-demo/core/ext/Schema"
import { TaskListIdU, TaskId } from "@effect-ts-demo/todo-types"

import { Task } from "."

export class Request extends WriteRequest<Request>()("POST", "/tasks", {
  body: props({
    listId: prop(TaskListIdU),
    title: Task.Model.Api.props.title,
    isFavorite: prop(bool),
    myDay: prop(nullable(date)),
  }),
}) {}

export class Response extends Model<Response>()(props({ id: prop(TaskId) })) {}
