import { pipe } from "@effect-ts/core"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import { getLoggedInUser } from "@/Tasks/shared"

import * as UserContext from "../Tasks/TaskContext"

import {
  Request,
  Response,
  SharableTaskListEntry,
} from "@effect-ts-demo/todo-client/Temp/GetMe"
import { TaskListOrGroup } from "@effect-ts-demo/todo-types/Task"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const u = yield* $(getLoggedInUser)

    return {
      name: u.name,
      inboxOrder: u.inboxOrder,
      lists: yield* $(
        pipe(
          UserContext.allLists(u.id),
          T.map((lists) => {
            const groups = Chunk.filterMap_(lists, (l) =>
              TaskListOrGroup.is.TaskListGroup(l) ? O.some(l) : O.none
            )
            return pipe(
              Chunk.map_(
                lists,
                TaskListOrGroup.match({
                  TaskListGroup: (l) => l,
                  TaskList: (l) =>
                    SharableTaskListEntry.build({
                      ...l,
                      parentListId: Chunk.find_(groups, (g) => g.lists.includes(l.id))[
                        "|>"
                      ](O.map((x) => x.id)),
                    }),
                })
              ),
              Chunk.toArray
            )
          })
        )
      ),
    } as Response
  })

export { Request, Response }
