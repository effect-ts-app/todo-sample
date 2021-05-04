import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import * as TaskContext from "./TaskContext"
import { getLoggedInUser } from "./shared"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTasks"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const u = yield* $(getLoggedInUser)
    const items = yield* $(TaskContext.all(u.id))

    const r: Response = {
      items: Chunk.map_(items, (t) => ({
        ...t,
        myDay: A.findFirst_(u.myDay, (x) => x.id === t.id)["|>"](O.map((m) => m.date)),
      }))["|>"](Chunk.toArray),
    }

    return r
  })

export { Request, Response }
