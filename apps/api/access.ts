import * as O from "@effect-ts-app/core/ext/Option"
import * as S from "@effect-ts-app/core/ext/Schema"
import {
  Task,
  TaskList,
  TaskListGroup,
  TaskListOrGroup,
  UserId,
} from "@effect-ts-demo/todo-types/"
import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import { Chunk } from "@effect-ts/core/Collections/Immutable/Chunk"

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

export function canAccessTask_(lists: Chunk<TaskList>) {
  return (t: Task, userId: UserId) =>
    // TODO: probably should loose access regardless if the user created it?
    t.createdBy === userId ||
    (t.listId !== "inbox" &&
      CNK.find_(lists, (l) => l.id === t.listId)
        ["|>"](O.map(canAccessList(userId)))
        ["|>"](O.getOrElse(() => false)))
}

export function canAccessTaskE_(lists: Chunk<TaskList>) {
  return (t: S.EncodedOf<typeof Task.Model>, userId: UserId) =>
    // TODO: probably should loose access regardless if the user created it?
    t.createdBy === userId ||
    (t.listId !== "inbox" &&
      CNK.find_(lists, (l) => l.id === t.listId)
        ["|>"](O.map(canAccessList(userId)))
        ["|>"](O.getOrElse(() => false)))
}

export function canAccessTask(lists: Chunk<TaskList>) {
  const xs = canAccessTask_(lists)
  return (userId: UserId) => (t: Task) => xs(t, userId)
}

export function canAccessTaskE(lists: Chunk<TaskList>) {
  const xs = canAccessTaskE_(lists)
  return (userId: UserId) => (t: S.EncodedOf<typeof Task.Model>) => xs(t, userId)
}
