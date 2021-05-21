import * as S from "@effect-ts-app/core/ext/Schema"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import { TodoContext } from "@/services"

export default handle(
  Tasks.Search,
  Tasks.Search.adapt
)((_) =>
  T.gen(function* ($) {
    const user = yield* $(TodoContext.getLoggedInUser)
    const tasks = yield* $(TodoContext.allTasks(user.id))

    const items = CNK.map_(tasks, (t) => ({
      ...t,
      myDay: A.findFirst_(user.myDay, (x) => x.id === t.id)["|>"](O.map((m) => m.date)),
    }))["|>"](CNK.toArray)

    const skipped = _.$skip ? items.slice(_.$skip) : items
    const paginated = _.$top ? skipped.slice(0, _.$top) : skipped
    return {
      items: paginated,
      count: _.$count ? (items.length as S.Int & S.Positive) : undefined,
    }
  })
)
