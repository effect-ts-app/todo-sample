import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import { Chunk } from "@effect-ts/core/Collections/Immutable/Chunk"
import * as O from "@effect-ts-app/core/ext/Option"
import * as S from "@effect-ts-app/core/ext/Schema"
import { makeAuthorize } from "@effect-ts-app/infra/app"
import { Task, TaskList, UserId } from "@effect-ts-demo/todo-types"

import * as TaskListAccess from "@/TaskLists/_access"

export function canAccess_(lists: Chunk<TaskList>) {
  const can = canAccessInternal_(lists)
  return (t: Task, userId: UserId) => can(t, userId)
}

export function canAccessE_(lists: Chunk<TaskList>) {
  const can = canAccessInternal_(lists)
  return (t: S.EncodedOf<typeof Task.Model>, userId: UserId) => can(t, userId)
}

function canAccessInternal_(lists: Chunk<TaskList>) {
  return (
    t: Pick<S.EncodedOf<typeof Task.Model>, "createdBy" | "listId">,
    userId: UserId
  ) =>
    // TODO: probably should loose access regardless if the user created it?
    t.createdBy === userId ||
    (t.listId !== "inbox" &&
      CNK.find_(lists, (l) => l.id === t.listId)
        ["|>"](O.map(TaskListAccess.canAccess(userId)))
        ["|>"](O.getOrElse(() => false)))
}

export function canAccess(lists: Chunk<TaskList>) {
  const xs = canAccess_(lists)
  return (userId: UserId) => (t: Task) => xs(t, userId)
}

export function canAccessE(lists: Chunk<TaskList>) {
  const xs = canAccessE_(lists)
  return (userId: UserId) => (t: S.EncodedOf<typeof Task.Model>) => xs(t, userId)
}

export const TaskAuth = (lists: Chunk<TaskList>) =>
  makeAuthorize(canAccess_(lists), "Task", (t) => t.id)
