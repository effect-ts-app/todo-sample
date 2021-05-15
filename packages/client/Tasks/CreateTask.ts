import {
  bool,
  date,
  Model,
  nonEmptyString,
  nullable,
  prop,
  props,
  WriteRequest,
} from "@effect-ts-demo/core/ext/Schema"
import { TaskListIdU, TaskId } from "@effect-ts-demo/todo-types"

export class Request extends WriteRequest<Request>()("POST", "/tasks", {
  body: props({
    listId: prop(TaskListIdU),
    title: prop(nonEmptyString),
    isFavorite: prop(bool),
    myDay: prop(nullable(date)),
  }),
}) {}

export class Response extends Model<Response>()(props({ id: prop(TaskId) })) {}
