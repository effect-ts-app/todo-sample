import { TaskId, UserId } from "@effect-ts-demo/todo-types/"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"

export const getLoggedInUser = T.gen(function* ($) {
  const u = yield* $(UserSVC.UserEnv)
  return yield* $(TaskContext.getUser(u.id))
})

export function addMyDay(userId: UserId, id: TaskId) {
  return (date: Date) =>
    TaskContext.updateUser(userId, (u) => ({
      ...u,
      myDay: A.findIndex_(u.myDay, (m) => m.id === id)
        ["|>"](O.chain((idx) => A.modifyAt_(u.myDay, idx, (m) => ({ ...m, date }))))
        ["|>"](O.getOrElse(() => A.concat_(u.myDay, [{ id, date }]))),
    }))
}
