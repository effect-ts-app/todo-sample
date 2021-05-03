import { pipe } from "@effect-ts/core"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"

import { UserSVC } from "@/services"

import * as UserContext from "../Tasks/TaskContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Temp/GetMe"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)
    const user = yield* $(UserContext.getUser(u.id))

    return {
      name: user.name,
      lists: yield* $(pipe(UserContext.allLists(u.id), T.map(Chunk.toArray))),
    }
  })

export { Request, Response }
