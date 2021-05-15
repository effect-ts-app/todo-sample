import * as S from "@effect-ts-demo/core/ext/Schema"

import { TaskView } from "./views"

export class Request extends S.ReadRequest<Request>()("GET", "/tasks", {}) {}

export class Response extends S.Model<Response>()(
  S.props({ items: S.prop(S.array(TaskView.Model)) })
) {}
