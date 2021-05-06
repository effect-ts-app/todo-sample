import { User } from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { getLoggedInUser } from "./shared"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/CreateTask"

export const handle = ({ myDay, ..._ }: Request) =>
  T.gen(function* ($) {
    const user = yield* $(getLoggedInUser)

    const task = user["|>"](User.createTask(_))
    yield* $(TaskContext.add(task))
    yield* $(
      pipe(
        EO.fromOption(myDay),
        EO.chainEffect((date) =>
          TaskContext.updateUser(user.id, User.addToMyDay(task, date))
        )
      )
    )

    return { id: task.id } as Response
  })

export { Request, Response }
