import { TaskListGroup, TaskListOrGroup } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import { Lens } from "@effect-ts/monocle"

import * as TaskContext from "./TaskContext"
import { handle } from "./shared"

import { flow } from "@effect-ts-demo/core/ext/Function"
import { NotFoundError } from "@effect-ts-demo/infra/errors"
import * as UpdateTaskListGroup from "@effect-ts-demo/todo-client/Tasks/UpdateTaskListGroup"

export default handle(UpdateTaskListGroup)(({ id, ..._ }) =>
  T.gen(function* ($) {
    //const user = yield* $(UserSVC.UserEnv)
    // TODO: Authorisation
    yield* $(
      TaskContext.updateListM(
        id,
        TaskListOrGroup.Api.matchW({
          TaskList: () => T.fail(new NotFoundError("TaskListGroup", id)),
          TaskListGroup: flow(
            TaskListGroup.lens["|>"](
              Lens.modify((t) => ({
                ...t,
                ..._,
              }))
            ),
            T.succeed
          ),
        })
      )
    )
  })
)
