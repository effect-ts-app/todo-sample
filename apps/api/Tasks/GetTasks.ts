import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import * as TaskContext from "./TaskContext"
import { getLoggedInUser } from "./shared"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTasks"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const user = yield* $(getLoggedInUser)
    const tasks = yield* $(TaskContext.all(user.id))

    const items = Chunk.map_(tasks, (t) => ({
      ...t,
      myDay: A.findFirst_(user.myDay, (x) => x.id === t.id)["|>"](O.map((m) => m.date)),
    }))["|>"](Chunk.toArray)

    return {
      items,
    } as Response
  })

export { Request, Response }
