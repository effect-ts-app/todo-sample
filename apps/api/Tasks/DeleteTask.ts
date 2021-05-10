import * as T from "@effect-ts/core/Effect"

import * as TaskContext from "./TaskContext"
import { authorizeTask, handle } from "./shared"

import { UserSVC } from "@effect-ts-demo/infra/services"
import * as DeleteTask from "@effect-ts-demo/todo-client/Tasks/DeleteTask"

export default handle(DeleteTask)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const t = yield* $(TaskContext.get(_.id))

    return yield* $(
      t["|>"](authorizeTask.authorizeM(user.id, (t) => TaskContext.delete(t.id)))
    )
  })
)
