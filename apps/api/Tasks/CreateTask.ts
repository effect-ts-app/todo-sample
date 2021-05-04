import { User } from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { getLoggedInUser } from "./shared"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/CreateTask"

export const handle = ({ myDay, ..._ }: Request) =>
  T.gen(function* ($) {
    const u = yield* $(getLoggedInUser)

    const t = u["|>"](User.createTask(_))
    yield* $(TaskContext.add(t))
    yield* $(
      pipe(
        EO.fromOption(myDay),
        EO.chainEffect((date) => TaskContext.updateUser(u.id, User.addToMyDay(t, date)))
      )
    )

    return { id: t.id }
  })

export { Request, Response }
