import { makeAuthorize } from "@effect-ts-app/infra/app"
import {
  TaskList,
  TaskListGroup,
  TaskListOrGroup,
  UserId,
} from "@effect-ts-demo/todo-types"

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

export function canAccess(userId: UserId) {
  return TaskListOrGroup.Api.matchW({
    TaskList: canAccessTaskList(userId),
    TaskListGroup: canAccessTaskListGroup(userId),
  })
}

export function canAccess_(l: TaskListOrGroup, userId: UserId) {
  return canAccess(userId)(l)
}

export const ListAuth = makeAuthorize(canAccess_, "TaskListOrGroup", (t) => t.id)
export const TaskListAuth = makeAuthorize(canAccessTaskList_, "TaskList", (t) => t.id)
export const GroupAuth = makeAuthorize(
  canAccessTaskListGroup_,
  "TaskListGroup",
  (t) => t.id
)
