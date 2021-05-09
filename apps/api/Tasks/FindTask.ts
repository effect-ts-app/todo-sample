import { User } from "@effect-ts-demo/todo-types/"

import * as TaskContext from "./TaskContext"
import { getLoggedInUser } from "./shared"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import * as O from "@effect-ts-demo/core/ext/Option"
import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/FindTask"

export const handle = (_: Request) =>
  EO.gen(function* ($) {
    const user = yield* $(getLoggedInUser["|>"](EO.fromEffect))
    const task = yield* $(TaskContext.find(_.id))

    return {
      ...task,
      myDay: user["|>"](User.getMyDay(task)),
    } as O._A<Response>
  })

export { Request, Response }
