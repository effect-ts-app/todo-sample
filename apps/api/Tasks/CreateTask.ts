import { Task, User } from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/CreateTask"

export const handle = ({ myDay, ..._ }: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)

    const t = Task.create({ ..._, createdBy: u.id, steps: [] })
    yield* $(TaskContext.add(t))
    yield* $(
      pipe(
        EO.fromOption(myDay),
        EO.chainEffect((date) =>
          TaskContext.updateUser(u.id, User.addToMyDay(t.id, date))
        )
      )
    )

    return { id: t.id }
  })

export { Request, Response }
