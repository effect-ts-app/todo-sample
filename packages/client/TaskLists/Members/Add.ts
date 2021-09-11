import { Post, prop, useClassNameForSchema } from "@effect-ts-app/core/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export class AddTaskListMemberRequest extends Post(
  "/lists/:id/members"
)<AddTaskListMemberRequest>()({
  id: prop(TaskListId),
  memberId: prop(UserId),
}) {}
