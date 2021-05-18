import { UserSVC } from "@effect-ts-app/infra/services"
import { TaskLists } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import { TodoContext } from "@/services"
import { authorizeTaskListGroup, handle } from "@/shared"

export default handle(TaskLists.UpdateGroup)(({ id, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    yield* $(
      TodoContext.updateTaskListGroupM(
        id,
        authorizeTaskListGroup.authorize(user.id, (tlg) => ({
          ...tlg,
          ..._,
          updatedAt: new Date(),
        }))
      )
    )
  })
)
