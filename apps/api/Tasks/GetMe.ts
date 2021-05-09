import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import { getLoggedInUser } from "@/Tasks/shared"

import * as UserContext from "../Tasks/TaskContext"

import {
  Request,
  Response,
  TaskListEntry,
} from "@effect-ts-demo/todo-client/Tasks/GetMe"
import { TaskListOrGroup } from "@effect-ts-demo/todo-types/Task"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const user = yield* $(getLoggedInUser)

    const allLists = yield* $(UserContext.allLists(user.id))
    const groups = Chunk.filterMap_(allLists, (l) =>
      l._tag === "TaskListGroup" ? O.some(l) : O.none
    )
    const lists = Chunk.map_(
      allLists,
      TaskListOrGroup.Api.matchW({
        TaskListGroup: (l) => l,
        TaskList: (l) =>
          new TaskListEntry({
            ...l,
            parentListId: Chunk.find_(groups, (g) => g.lists.includes(l.id))["|>"](
              O.map((x) => x.id)
            ),
          }),
      })
    )["|>"](Chunk.toArray)
    const r = {
      name: user.name,
      inboxOrder: user.inboxOrder,
      lists,
    } as Response
    return r
  })

export { Request, Response }
