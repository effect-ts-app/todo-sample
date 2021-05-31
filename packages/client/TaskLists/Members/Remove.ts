import { Delete, namedC, prop } from "@effect-ts-app/core/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types"

@namedC
export default class RemoveTaskListMember extends Delete(
  "/lists/:id/members/:memberId"
)<RemoveTaskListMember>()({
  id: prop(TaskListId),
  memberId: prop(UserId),
}) {}
