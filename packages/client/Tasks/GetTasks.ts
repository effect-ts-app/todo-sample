import * as S from "@effect-ts-demo/core/ext/Schema"

import { TaskView } from "./views"

export class RequestHeaders extends S.Model<RequestHeaders>()(
  S.required({ "x-user-id": S.nonEmptyString })
) {}
export class Request extends S.Model<Request>()(S.required({})) {
  static Headers = RequestHeaders
}

const Response_ = S.struct({
  required: { items: S.array(TaskView.Model) },
})
export interface Response extends S.ParsedShapeOf<typeof Response_> {}
export const Response = S.opaque<Response>()(Response_)
