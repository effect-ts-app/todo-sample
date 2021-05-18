import { UserSVC } from "@effect-ts-app/infra/services"
import { TaskLists } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import { TodoContext } from "@/services"
import { authorizeList, handle } from "@/shared"

export default handle(TaskLists.Remove)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const list = yield* $(TodoContext.getList(_.id))

    return yield* $(
      authorizeList.authorizeM_(list, user.id, (tl) => TodoContext.removeList(tl.id))
    )
  })
)
