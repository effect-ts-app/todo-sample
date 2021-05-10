import {
  Task,
  TaskList,
  TaskListGroup,
  TaskListOrGroup,
  UserId,
} from "@effect-ts-demo/todo-types/"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"

import * as O from "@effect-ts-demo/core/ext/Option"

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

export function canAccessTask(lists: Chunk.Chunk<TaskList>) {
  return (t: Task, userId: UserId) =>
    // TODO: probably should loose access regardless if the user created it?
    t.createdBy === userId ||
    (t.listId !== "inbox" &&
      Chunk.find_(lists, (l) => l.id === t.listId)
        ["|>"](O.map(canAccessList(userId)))
        ["|>"](O.getOrElse(() => false)))
}
