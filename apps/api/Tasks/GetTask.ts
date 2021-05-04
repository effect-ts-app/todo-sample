import { User } from "@effect-ts-demo/todo-types/"
import { _A } from "@effect-ts/core/Utils"

import * as TaskContext from "./TaskContext"
import { getLoggedInUser } from "./shared"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTask"

export const handle = (_: Request) =>
  EO.gen(function* ($) {
    const u = yield* $(getLoggedInUser["|>"](EO.fromEffect))
    const t = yield* $(TaskContext.find(_.id))

    return {
      ...t,
      myDay: User.getMyDay(u, t),
    } as _A<Response>
  })

export { Request, Response }
