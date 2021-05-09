import { Compute } from "@effect-ts-demo/core/ext/Compute"
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
export const Response = S.required({ id: TaskId })
export type Response = Compute<S.ParsedShapeOf<typeof Response>>
