import { handle } from "@effect-ts-app/infra/app"
import { TaskLists } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import { TodoContext, UserSVC } from "@/services"

import { GroupAuth } from "./access"

export default handle(TaskLists.UpdateGroup)(({ id, ..._ }) =>
  T.gen(function* ($) {
    const { Lists } = yield* $(TodoContext.TodoContext)

    const user = yield* $(UserSVC.UserEnv)
    yield* $(
      Lists.updateGroupM(
        id,
        GroupAuth.access(user.id, (tlg) => ({
          ...tlg,
          ..._,
          updatedAt: new Date(),
        }))
      )
    )
  })
)
