import { handle } from "@effect-ts-app/infra/app"
import { TaskLists } from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"

import { TodoContext, UserSVC } from "@/services"

import { TaskListAuth } from "../access"

export default handle(TaskLists.RemoveMember)(({ id, ..._ }) =>
  T.gen(function* ($) {
    const { Lists } = yield* $(TodoContext.TodoContext)

    const user = yield* $(UserSVC.UserEnv)
    yield* $(
      Lists.updateListM(
        id,
        TaskListAuth.access(user.id, (tl) => ({
          ...tl,
          members: A.filter_(tl.members, (m) => m.id !== _.memberId),
        }))
      )
    )
  })
)
