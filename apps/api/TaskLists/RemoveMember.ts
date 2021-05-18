import { handle } from "@effect-ts-app/infra/app"
import { UserSVC } from "@effect-ts-app/infra/services"
import { TaskLists } from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"

import { authorizeTaskList } from "@/access"
import { TodoContext } from "@/services"

export default handle(TaskLists.RemoveMember)(({ id, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    yield* $(
      TodoContext.updateTaskListM(
        id,
        authorizeTaskList.authorize(user.id, (tl) => ({
          ...tl,
          members: A.filter_(tl.members, (m) => m.id !== _.memberId),
        }))
      )
    )
  })
)
