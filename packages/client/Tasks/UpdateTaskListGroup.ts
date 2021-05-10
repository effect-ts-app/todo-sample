import * as S from "@effect-ts-demo/core/ext/Schema"
import { EditableTaskListGroupProps, TaskListId } from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core"

export class RequestPath extends S.Model<RequestPath>()(
  pipe(S.required({ id: TaskListId }))
) {}
export class RequestBody extends S.Model<RequestBody>()(
  pipe(S.partial({ ...EditableTaskListGroupProps }))
) {}
export class Request extends S.Model<Request>()(
  RequestBody.Model["|>"](S.intersect(RequestPath.Model))
) {
  static readonly Body = RequestBody
  static readonly Path = RequestPath
}
