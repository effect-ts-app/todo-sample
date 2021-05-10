import {
  Task,
  TaskList,
  TaskListGroup,
  TaskListOrGroup,
  UserId,
} from "@effect-ts-demo/todo-types/"

export function canAccessTaskList(userId: UserId) {
  return (l: TaskList) => canAccessTaskList_(l, userId)
}

export function canAccessTaskList_(l: TaskList, userId: UserId) {
  return l.ownerId === userId || l.members.some((m) => m.id === userId)
}

export function canAccessTaskListGroup(userId: UserId) {
  return (l: TaskListGroup) => canAccessTaskListGroup_(l, userId)
}

export function canAccessTaskListGroup_(l: TaskListGroup, userId: UserId) {
  return l.ownerId === userId
}

export function canAccessList(userId: UserId) {
  return TaskListOrGroup.Api.matchW({
    TaskList: canAccessTaskList(userId),
    TaskListGroup: canAccessTaskListGroup(userId),
  })
}

export function canAccessList_(l: TaskListOrGroup, userId: UserId) {
  return canAccessList(userId)(l)
}

export function canAccessTask(t: Task, userId: UserId) {
  // TODO: or if part of a list that is part of a group the user is member of ;-)
  return t.createdBy === userId
}
