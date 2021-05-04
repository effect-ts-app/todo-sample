import { Void } from "@effect-ts-demo/core/ext/Model"
import {
  EditablePersonalTaskProps,
  EditableTaskProps,
  TaskId,
} from "@effect-ts-demo/todo-types"
import { make, AType, EType, opaque } from "@effect-ts/morphic"

const RequestPath_ = make((F) =>
  F.interface({
    id: TaskId(F),
  })
)
const RequestBody_ = make((F) =>
  F.partial({ ...EditableTaskProps(F), ...EditablePersonalTaskProps(F) })
)
const Request_ = make((F) => F.intersection(RequestPath_(F), RequestBody_(F))())

export interface Request extends AType<typeof Request_> {}
export interface RequestE extends EType<typeof Request_> {}
export const Request = Object.assign(opaque<RequestE, Request>()(Request_), {
  Body: RequestBody_,
  Path: RequestPath_,
})

export const Response = Void
export type Response = AType<typeof Response>
export type ResponseE = EType<typeof Response>
