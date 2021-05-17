import { prop, Delete, namedC } from "@effect-ts-demo/core/ext/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types/"

@namedC()
export default class RemovetaskListMember extends Delete(
  "/lists/:id/members/:memberId"
)<Request>()({
  id: prop(TaskListId),
  memberId: prop(UserId),
}) {}
