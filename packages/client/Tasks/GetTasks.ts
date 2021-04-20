import { Task } from "@effect-ts-demo/todo-types"
import { make, AType, EType, opaque } from "@effect-ts/morphic"

export const Request = make((F) => F.interface({}))
export type Request = AType<typeof Request>
export type RequestE = EType<typeof Request>

const Response_ = make((F) => F.interface({ items: F.array(Task(F)) }))
export interface Response extends AType<typeof Response_> {}
export interface ResponseE extends EType<typeof Response_> {}
export const Response = opaque<ResponseE, Response>()(Response_)
