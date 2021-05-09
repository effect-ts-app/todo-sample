import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core"

export class RequestBody extends S.Model<RequestBody>()(
  pipe(S.required({ order: S.array(TaskId), listId: S.nonEmptyString })) // TaskListId: union of "inbox" and "UUID"
) {}
export class Request extends S.Model<Request>()(RequestBody.Model) {
  static readonly Body = RequestBody
}

export const Response = S.Void
export type Response = S.ParsedShapeOf<typeof Response>
