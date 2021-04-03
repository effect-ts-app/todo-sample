import { Task } from "@effect-ts-demo/todo-types"
import * as MO from "@effect-ts/morphic"

export const Request = MO.make((F) => F.unknown())
export type Request = MO.AType<typeof Request>
export type RequestE = MO.EType<typeof Request>

const Response_ = MO.make((F) => F.interface({ tasks: F.array(Task(F)) }))
export interface Response extends MO.AType<typeof Response_> {}
export interface ResponseE extends MO.EType<typeof Response_> {}
export const Response = MO.opaque<ResponseE, Response>()(Response_)
