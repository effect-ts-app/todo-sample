import * as S from "@effect-ts-demo/core/ext/Schema"
import {
  EditablePersonalTaskProps,
  EditableTaskProps,
  TaskId,
} from "@effect-ts-demo/todo-types"

export class RequestBody extends S.Model<RequestBody>()(
  S.partial({
    ...EditableTaskProps,
    ...EditablePersonalTaskProps,
  })
) {}
export class RequestPath extends S.Model<RequestPath>()(S.required({ id: TaskId })) {}
export class Request extends S.Model<Request>()(
  S.intersect(RequestPath.Model)(RequestBody.Model)
) {
  static Body = RequestBody
  static Path = RequestPath
}

export const Response = S.Void
export type Response = S.ParsedShapeOf<typeof Response>
