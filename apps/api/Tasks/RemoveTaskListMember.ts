import { UserSVC } from "@effect-ts-demo/infra/services"
import { Tasks } from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeTaskList, handle } from "./shared"

export default handle(Tasks.RemoveTaskListMember)(({ id, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    yield* $(
      TaskContext.updateTaskListM(
        id,
        authorizeTaskList.authorize(user.id, (tl) => ({
          ...tl,
          members: A.filter_(tl.members, (m) => m.id !== _.memberId),
        }))
      )
    )
  })
)
