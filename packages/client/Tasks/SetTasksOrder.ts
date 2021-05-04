import { Void } from "@effect-ts-demo/core/ext/Model"
import { TaskId, TaskListId } from "@effect-ts-demo/todo-types"
import { make, AType, EType, opaque } from "@effect-ts/morphic"

const RequestBody_ = make((F) =>
  F.interface({
    order: F.array(TaskId(F)),
    listId: TaskListId(F),
  })
)
const Request_ = make((F) => F.intersection(RequestBody_(F))())
export interface Request extends AType<typeof Request_> {}
export interface RequestE extends EType<typeof Request_> {}
export const Request = Object.assign(opaque<RequestE, Request>()(Request_), {
  Body: RequestBody_,
})

export const Response = Void
export type Response = AType<typeof Response>
export type ResponseE = EType<typeof Response>
