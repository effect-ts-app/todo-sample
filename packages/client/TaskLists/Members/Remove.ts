import { Delete, prop, useClassNameForSchema } from "@effect-ts-app/core/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export class RemoveTaskListMemberRequest extends Delete(
  "/lists/:id/members/:memberId"
)<RemoveTaskListMemberRequest>()({
  id: prop(TaskListId),
  memberId: prop(UserId),
}) {}
