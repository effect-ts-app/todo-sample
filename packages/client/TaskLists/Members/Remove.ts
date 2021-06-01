import { Delete, prop, useClassNameForSchema } from "@effect-ts-app/core/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export default class RemoveTaskListMember extends Delete(
  "/lists/:id/members/:memberId"
)<RemoveTaskListMember>()({
  id: prop(TaskListId),
  memberId: prop(UserId),
}) {}
