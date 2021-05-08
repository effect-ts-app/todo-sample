import * as S from "@effect-ts-demo/core/ext/Schema"
import { Step, TaskId, UserId } from "@effect-ts-demo/todo-types"

// TODO:  ...EditableTaskProps(F), ...EditablePersonalTaskProps(F)
export class RequestBody extends S.Model<RequestBody>()(
  S.partial({
    title: S.nonEmptyString,
    completed: S.nullable(S.date),
    isFavorite: S.bool, // TODO: Add bool

    due: S.nullable(S.date),
    reminder: S.nullable(S.date),
    note: S.nullable(S.nonEmptyString),
    steps: S.array(Step.Model),
    assignedTo: S.nullable(UserId),
    myDay: S.nullable(S.date),
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
