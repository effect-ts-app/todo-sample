import { Post, prop, useClassNameForSchema } from "@effect-ts-app/core/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export default class AddTaskListMember extends Post(
  "/lists/:id/members"
)<AddTaskListMember>()({
  id: prop(TaskListId),
  memberId: prop(UserId),
}) {}
