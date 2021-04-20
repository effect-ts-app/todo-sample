import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import { make, AType, EType, opaque } from "@effect-ts/morphic"

const RequestBody_ = make((F) =>
  F.interface({
    title: NonEmptyString(F),
    isFavorite: F.boolean(),
    myDay: F.nullable(F.date()),
  })
)
const Request_ = make((F) => F.intersection(RequestBody_(F))())
export interface Request extends AType<typeof Request_> {}
export interface RequestE extends EType<typeof Request_> {}
export const Request = Object.assign(opaque<RequestE, Request>()(Request_), {
  Body: RequestBody_,
})

const Response_ = make((F) => F.interface({ id: F.uuid() }))
export interface Response extends AType<typeof Response_> {}
export interface ResponseE extends EType<typeof Response_> {}
export const Response = opaque<ResponseE, Response>()(Response_)
