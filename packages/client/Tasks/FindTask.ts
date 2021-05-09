import { Compute } from "@effect-ts-demo/core/ext/Compute"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskId } from "@effect-ts-demo/todo-types"

import { TaskView } from "./views"

export class RequestPath extends S.Model<RequestPath>()(S.required({ id: TaskId })) {}
export class Request extends S.Model<Request>()(RequestPath.Model) {
  static Path = RequestPath
}

export const Response = S.nullable(TaskView.Model)
export type Response = Compute<S.ParsedShapeOf<typeof Response>>
