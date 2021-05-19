import { handle } from "@effect-ts-app/infra/app"
import { TaskLists } from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"

import { TodoContext, UserSVC } from "@/services"

import { TaskListAuth } from "../access"

export default handle(TaskLists.AddMember)((_) =>
  T.gen(function* ($) {
    const { Lists, Users } = yield* $(TodoContext.TodoContext)

    const user = yield* $(UserSVC.UserEnv)
    const member = yield* $(Users.get(_.memberId))
    yield* $(
      Lists.updateListM(
        _.id,
        TaskListAuth.access(user.id, (tl) => ({
          ...tl,
          members: A.snoc_(tl.members, { id: member.id, name: member.name }),
        }))
      )
    )
  })
)
