import { Tasks } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeTaskListGroup, handle } from "./shared"

import { UserSVC } from "@effect-ts-demo/infra/services"

export default handle(Tasks.UpdateTaskListGroup)(({ id, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    yield* $(
      TaskContext.updateTaskListGroupM(
        id,
        authorizeTaskListGroup.authorize(user.id, (g) => ({
          ...g,
          ..._,
          updatedAt: new Date(),
        }))
      )
    )
  })
)
