import { UserSVC } from "@effect-ts-demo/infra/services"
import { Tasks } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeList, handle } from "./shared"

export default handle(Tasks.DeleteTaskList)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const list = yield* $(TaskContext.getList(_.id))

    return yield* $(
      authorizeList.authorizeM_(list, user.id, (tl) => TaskContext.deleteList(tl.id))
    )
  })
)
