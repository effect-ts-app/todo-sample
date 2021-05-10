import { Task, TaskListOrGroup, UserId } from "@effect-ts-demo/todo-types/"

export function canAccessList(userId: UserId) {
  return TaskListOrGroup.Api.matchW({
    TaskList: (l) => l.ownerId === userId || l.members.some((m) => m.id === userId),
    TaskListGroup: (g) => g.ownerId === userId,
  })
}

export function canAccessTask(userId: UserId, t: Task) {
  // TODO: or if part of a list that is part of a group the user is member of ;-)
  return t.createdBy === userId
}
