import { NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import { Task, TaskListId } from "@effect-ts-demo/todo-types"
import { make, AType, EType, opaque } from "@effect-ts/morphic"

const RequestHeaders_ = make((F) =>
  F.interface({
    "x-user-id": NonEmptyString(F),
  })
)
const RequestPath_ = make((F) =>
  F.interface({
    listId: TaskListId(F),
  })
)
const Request_ = make((F) => F.intersection(RequestPath_(F))())
export interface Request extends AType<typeof Request_> {}
export interface RequestE extends EType<typeof Request_> {}
export const Request = Object.assign(opaque<RequestE, Request>()(Request_), {
  Path: RequestPath_,
  Headers: RequestHeaders_,
})

const Response_ = make((F) =>
  F.interface({ title: NonEmptyString(F), items: F.array(Task(F)) })
)
export interface Response extends AType<typeof Response_> {}
export interface ResponseE extends EType<typeof Response_> {}
export const Response = opaque<ResponseE, Response>()(Response_)
