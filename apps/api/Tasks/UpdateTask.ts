import { Task } from "@effect-ts-demo/todo-types"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"
import { Lens } from "@effect-ts/monocle"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"
import { addMyDay } from "./shared"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/UpdateTask"

export const handle = ({ id, myDay, ..._ }: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)
    yield* $(
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
      yield* $(
        O.fold_(
          myDay,
          () =>
            TaskContext.updateUser(u.id, (u) => ({
              ...u,
              myDay: u.myDay["|>"](A.filter((m) => m.id !== id)),
            })),
          addMyDay(u.id, id)
        )
      )
    }
  })

export { Request, Response }
