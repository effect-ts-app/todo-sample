import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/UpdateTask"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"
import { Lens } from "@effect-ts/monocle"

import * as TaskContext from "./TaskContext"

import { Task } from "@/../../packages/types"

export const handle = (_: Request) =>
  TaskContext.find(_.id)
    ["|>"](T.chain(O.fold(() => T.die(`Did not find Task#${_.id}`), T.succeed)))
    ["|>"](T.map(Task.lens["|>"](Lens.props("completed", "steps", "title")).set(_)))
    ["|>"](T.tap(TaskContext.add))
    ["|>"](T.map(() => ({})))

export { Request, Response }
