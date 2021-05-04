import { Task } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import { Lens } from "@effect-ts/monocle"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"
import { toggleMyDay } from "./shared"

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
      yield* $(myDay["|>"](toggleMyDay(u.id, id)))
    }
  })

export { Request, Response }
