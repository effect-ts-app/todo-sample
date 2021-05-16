import { UserSVC } from "@effect-ts-demo/infra/services"
import { Tasks } from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeTaskList, handle } from "./shared"

export default handle(Tasks.AddTaskListMember)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const member = yield* $(TaskContext.getUser(_.memberId))
    yield* $(
      TaskContext.updateTaskListM(
        _.id,
        authorizeTaskList.authorize(user.id, (tl) => ({
          ...tl,
          members: A.snoc_(tl.members, { id: member.id, name: member.name }),
        }))
      )
    )
  })
)
