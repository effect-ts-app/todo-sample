import { TaskListOrGroup } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"

import { canAccessList } from "@/access"
import { NotFoundError, UnauthorizedError } from "@/errors"

import * as TaskContext from "./TaskContext"
import { handle } from "./shared"

import { flow } from "@effect-ts-demo/core/ext/Function"
import { UserSVC } from "@effect-ts-demo/infra/services"
import * as UpdateTaskListGroup from "@effect-ts-demo/todo-client/Tasks/UpdateTaskListGroup"

export default handle(UpdateTaskListGroup)(({ id, ..._ }) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)
    yield* $(
      TaskContext.updateListM(
        id,
        flow(
          TaskListOrGroup.Api.matchW({
            TaskListGroup: (g) =>
              !canAccessList(user.id)(g)
                ? T.fail(new UnauthorizedError())
                : T.succeed({
                    ...g,
                    ..._,
                  }),
            TaskList: () => T.fail(new NotFoundError("TaskListGroup", id)),
          }),
          T.union
        )
      )
    )
  })
)
