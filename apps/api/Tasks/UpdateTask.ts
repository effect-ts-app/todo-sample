import { Task, User } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import { Lens } from "@effect-ts/monocle"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/UpdateTask"

export const handle = ({ id, myDay, ..._ }: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)

    const t = yield* $(
      TaskContext.update(
        id,
        Task.lens["|>"](
          Lens.modify((t) => ({
            ...t,
            ..._,
            updatedAt: new Date(),
          }))
        )
      )
    )
    if (myDay) {
      yield* $(TaskContext.updateUser(u.id, User.toggleMyDay(t, myDay)))
    }
  })

export { Request, Response }
