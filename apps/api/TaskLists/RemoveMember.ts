import { UserSVC } from "@effect-ts-app/infra/services"
import { TaskLists } from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"

import { TodoContext } from "@/services"
import { authorizeTaskList, handle } from "@/shared"

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
