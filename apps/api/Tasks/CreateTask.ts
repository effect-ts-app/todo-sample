import { Task } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"
import { addMyDay } from "./shared"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/CreateTask"

export const handle = ({ myDay, ..._ }: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)

    const t = Task.create({ ..._, createdBy: u.id, steps: [] })
    yield* $(TaskContext.add(t))
    if (O.isSome(myDay)) {
      yield* $(myDay.value["|>"](addMyDay(u.id, t.id)))
    }

    return { id: t.id }
  })

export { Request, Response }
