import * as S from "@effect-ts-demo/core/ext/Schema"

import { TaskView } from "./views"

export class Request extends S.ReadRequest<Request>()({
  headers: S.required({ "x-user-id": S.nonEmptyString }),
}) {}

export class Response extends S.Model<Response>()(
  S.struct({
    required: { items: S.array(TaskView.Model) },
  })
) {}
