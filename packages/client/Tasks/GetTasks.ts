import { NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import { make, AType, EType, opaque } from "@effect-ts/morphic"

import { TaskView } from "./views"

const RequestHeaders_ = make((F) =>
  F.interface({
    "x-user-id": NonEmptyString(F),
  })
)
const Request_ = make((F) => F.interface({}))
export interface Request extends AType<typeof Request_> {}
export interface RequestE extends EType<typeof Request_> {}
export const Request = Object.assign(opaque<RequestE, Request>()(Request_), {
  Headers: RequestHeaders_,
})

const Response_ = make((F) => F.interface({ items: F.array(TaskView(F)) }))
export interface Response extends AType<typeof Response_> {}
export interface ResponseE extends EType<typeof Response_> {}
export const Response = opaque<ResponseE, Response>()(Response_)
