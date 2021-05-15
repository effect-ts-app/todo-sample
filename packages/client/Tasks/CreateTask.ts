import {
  date,
  include,
  Model,
  nullable,
  prop,
  props,
  WriteRequest,
} from "@effect-ts-demo/core/ext/Schema"
import { TaskId, Task } from "@effect-ts-demo/todo-types"

export class Request extends WriteRequest<Request>()("POST", "/tasks", {
  body: props({
    ...include(Task.Model.Api.props)(({ isFavorite, listId, title }) => ({
      listId,
      title,
      isFavorite,
    })),
    myDay: prop(nullable(date)),
  }),
}) {}

export class Response extends Model<Response>()(props({ id: prop(TaskId) })) {}
