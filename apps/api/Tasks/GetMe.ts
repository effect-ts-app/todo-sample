import { Tasks } from "@effect-ts-demo/todo-client"
import { TaskListGroup, TaskListOrGroup } from "@effect-ts-demo/todo-types"
import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import { TodoContext } from "@/services"
import { getLoggedInUser, handle } from "@/shared"

export default handle(Tasks.GetMe)((_) =>
  T.gen(function* ($) {
    const user = yield* $(getLoggedInUser)

    const allLists = yield* $(TodoContext.allLists(user.id))
    const groups = CNK.filterMap_(allLists, (l) =>
      TaskListGroup.Guard(l) ? O.some(l) : O.none
    )
    const lists = CNK.map_(
      allLists,
      TaskListOrGroup.Api.matchW({
        TaskListGroup: (g) => g,
        TaskList: (l) =>
          new Tasks.GetMe.TaskListEntry({
            ...l,
            parentListId: CNK.find_(groups, (g) => g.lists.includes(l.id))["|>"](
              O.map((x) => x.id)
            ),
          }),
      })
    )["|>"](CNK.toArray)

    return {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      inboxOrder: user.inboxOrder,
      lists,
    }
  })
)
