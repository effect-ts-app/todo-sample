import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListIdU, TaskId } from "@effect-ts-demo/todo-types"

export class RequestBody extends S.Model<RequestBody>()(
  S.required({
    listId: TaskListIdU,
    title: S.nonEmptyString,
    isFavorite: S.bool,
    myDay: S.nullable(S.date),
  })
) {}
export class Request extends S.Model<Request>()(RequestBody.Model) {
  static Body = RequestBody
}

// export class Response extends S.Model<Response>()(S.required({ id: TaskId })) {}
const Response_ = S.required({ id: TaskId })
export interface Response extends S.ParsedShapeOf<typeof Response_> {}
export const Response = S.opaque<Response>()(Response_)
