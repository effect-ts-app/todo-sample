import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as MO from "@effect-ts-app/core/Schema"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { User } from "@effect-ts-demo/todo-types/"

import { TodoContext } from "@/services"

export default handle(
  Tasks.Search,
  Tasks.Search.adapt
)(({ $count, $skip, $top }) =>
  T.gen(function* ($) {
    const user = yield* $(TodoContext.getLoggedInUser)
    const tasks = yield* $(TodoContext.allTasks(user.id))

    const skipped = $skip ? CNK.toArray(tasks).slice($skip) : CNK.toArray(tasks)
    const paginated = $top ? skipped.slice(0, $top) : skipped
    const items = A.map_(paginated, User.personaliseTask.r(user))

    return {
      items,
      count: $count ? (items.length as MO.Int & MO.Positive) : undefined,
    }
  })
)
