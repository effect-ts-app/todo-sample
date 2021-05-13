import { Tasks } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeTaskList, handle } from "./shared"

import { UserSVC } from "@effect-ts-demo/infra/services"

export default handle(Tasks.UpdateTaskList)(({ id, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    yield* $(
      TaskContext.updateTaskListM(
        id,
        authorizeTaskList.authorize(user.id, (g) => ({
          ...g,
          ..._,
        }))
      )
    )
  })
)
