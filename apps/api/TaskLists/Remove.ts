import { handle } from "@effect-ts-app/infra/app"
import { UserSVC } from "@effect-ts-app/infra/services"
import { TaskLists } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import { authorizeList } from "@/access"
import { TodoContext } from "@/services"

export default handle(TaskLists.Remove)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const list = yield* $(TodoContext.getList(_.id))

    return yield* $(
      authorizeList.authorizeM_(list, user.id, (tl) => TodoContext.removeList(tl.id))
    )
  })
)
