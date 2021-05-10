import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

import { TaskView } from "./views"

export class Request extends S.ReadRequest<Request>()({
  path: S.required({ id: TaskId }),
}) {}

export const Response = S.nullable(TaskView.Model)
export type Response = S.ParsedShapeOf<typeof Response>
