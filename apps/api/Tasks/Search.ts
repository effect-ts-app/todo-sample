import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as S from "@effect-ts-app/core/Schema"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { User } from "@effect-ts-demo/todo-types/"

import { TodoContext } from "@/services"

export default handle(
  Tasks.Search,
  Tasks.Search.adapt
)((_) =>
  T.gen(function* ($) {
    const user = yield* $(TodoContext.getLoggedInUser)
    const tasks = yield* $(TodoContext.allTasks(user.id))

    const skipped = _.$skip ? CNK.toArray(tasks).slice(_.$skip) : CNK.toArray(tasks)
    const paginated = _.$top ? skipped.slice(0, _.$top) : skipped
    const items = A.map_(paginated, User.personaliseTask.r(user))

    return {
      items,
      count: _.$count ? (items.length as S.Int & S.Positive) : undefined,
    }
  })
)
