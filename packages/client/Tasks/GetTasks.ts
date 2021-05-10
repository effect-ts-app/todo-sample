import * as S from "@effect-ts-demo/core/ext/Schema"

import { TaskView } from "./views"

export class RequestHeaders extends S.Model<RequestHeaders>()(
  S.required({ "x-user-id": S.nonEmptyString })
) {}
export class Request extends S.Model<Request>()(S.required({})) {
  static Headers = RequestHeaders
}

export class Response extends S.Model<Response>()(
  S.struct({
    required: { items: S.array(TaskView.Model) },
  })
) {}
