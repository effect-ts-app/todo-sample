import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskId, TaskListIdU } from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core"

export class RequestBody extends S.Model<RequestBody>()(
  pipe(S.required({ order: S.array(TaskId), listId: TaskListIdU }))
) {}
export class Request extends S.Model<Request>()(RequestBody.Model) {
  static readonly Body = RequestBody
}
