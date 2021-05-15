import { Tasks } from "@effect-ts-demo/todo-client"
import { TaskListGroup, TaskListOrGroup } from "@effect-ts-demo/todo-types/Task"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import { getLoggedInUser, handle } from "@/Tasks/shared"

import * as UserContext from "../Tasks/TaskContext"

export default handle(Tasks.GetMe)((_) =>
  T.gen(function* ($) {
    const user = yield* $(getLoggedInUser)

    const allLists = yield* $(UserContext.allLists(user.id))
    const groups = Chunk.filterMap_(allLists, (l) =>
      TaskListGroup.Guard(l) ? O.some(l) : O.none
    )
    const lists = Chunk.map_(
      allLists,
      TaskListOrGroup.Api.matchW({
        TaskListGroup: (g) => g,
        TaskList: (l) =>
          new Tasks.GetMe.TaskListEntry({
            ...l,
            parentListId: Chunk.find_(groups, (g) => g.lists.includes(l.id))["|>"](
              O.map((x) => x.id)
            ),
          }),
      })
    )["|>"](Chunk.toArray)

    return {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      inboxOrder: user.inboxOrder,
      lists,
    }
  })
)
