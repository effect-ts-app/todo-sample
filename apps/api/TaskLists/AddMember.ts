import { UserSVC } from "@effect-ts-app/infra/services"
import { TaskLists } from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"

import { TodoContext } from "@/services"

import { authorizeTaskList, handle } from "../shared"

export default handle(TaskLists.AddMember)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const member = yield* $(TodoContext.getUser(_.memberId))
    yield* $(
      TodoContext.updateTaskListM(
        _.id,
        authorizeTaskList.authorize(user.id, (tl) => ({
          ...tl,
          members: A.snoc_(tl.members, { id: member.id, name: member.name }),
        }))
      )
    )
  })
)
