import { namedC, Post, prop } from "@effect-ts-app/core/ext/Schema"
import { TaskListId, UserId } from "@effect-ts-demo/todo-types/"

@namedC("AddTaskListMember")
export class Request extends Post("/lists/:id/members")<Request>()({
  id: prop(TaskListId),
  memberId: prop(UserId),
}) {}
