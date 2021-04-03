import { Task } from "@effect-ts-demo/todo-types"
import { make, AType, EType, opaque } from "@effect-ts/morphic"

export const Request = make((F) => F.unknown())
export type Request = AType<typeof Request>
export type RequestE = EType<typeof Request>

const Response_ = make((F) => F.interface({ tasks: F.array(Task(F)) }))
export interface Response extends AType<typeof Response_> {}
export interface ResponseE extends EType<typeof Response_> {}
export const Response = opaque<ResponseE, Response>()(Response_)
