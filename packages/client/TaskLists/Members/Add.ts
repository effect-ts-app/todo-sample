import { namedC, Post, prop } from "@effect-ts-app/core/ext/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types"

@namedC
export default class AddTaskListMember extends Post(
  "/lists/:id/members"
)<AddTaskListMember>()({
  id: prop(TaskListId),
  memberId: prop(UserId),
}) {}
