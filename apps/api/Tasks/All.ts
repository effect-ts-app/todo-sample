import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import { TodoContext } from "@/services"

export default handle(Tasks.All)((_) =>
  T.gen(function* ($) {
    const user = yield* $(TodoContext.getLoggedInUser)
    const tasks = yield* $(TodoContext.all(user.id))

    const items = CNK.map_(tasks, (t) => ({
      ...t,
      myDay: A.findFirst_(user.myDay, (x) => x.id === t.id)["|>"](O.map((m) => m.date)),
    }))["|>"](CNK.toArray)

    return {
      items,
    }
  })
)
