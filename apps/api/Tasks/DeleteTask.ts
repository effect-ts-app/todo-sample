import * as T from "@effect-ts/core/Effect"

import { canAccessTask } from "@/access"
import { UnauthorizedError } from "@/errors"

import * as TaskContext from "./TaskContext"
import { handle } from "./shared"

import { UserSVC } from "@effect-ts-demo/infra/services"
import * as DeleteTask from "@effect-ts-demo/todo-client/Tasks/DeleteTask"

export default handle(DeleteTask)((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    const t = yield* $(TaskContext.get(_.id))
    if (!canAccessTask(user.id, t)) {
      yield* $(T.fail(new UnauthorizedError()))
    }
    yield* $(TaskContext.delete(_.id))
  })
)
