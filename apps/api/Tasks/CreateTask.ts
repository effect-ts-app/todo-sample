import { Task } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/CreateTask"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)
    const t = Task.create({ ..._, createdBy: u.id, steps: [] })
    yield* $(TaskContext.add(t))
    return { id: t.id }
  })

export { Request, Response }
