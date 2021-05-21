import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"
import { handle } from "@effect-ts-app/infra/app"
import { Me } from "@effect-ts-demo/todo-client"
import { TaskListGroup, TaskListOrGroup } from "@effect-ts-demo/todo-types"

import { TodoContext } from "@/services"

export default handle(Me.Index)((_) =>
  T.gen(function* ($) {
    const { Lists } = yield* $(TodoContext.TodoContext)

    const user = yield* $(TodoContext.getLoggedInUser)
    const allLists = yield* $(Lists.all(user.id))
    const groups = CNK.filterMap_(allLists, (l) =>
      TaskListGroup.Guard(l) ? O.some(l) : O.none
    )
    const lists = CNK.map_(
      allLists,
      TaskListOrGroup.Api.matchW({
        TaskListGroup: (g) => g,
        TaskList: (l) =>
          new Me.Index.TaskListEntry({
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
