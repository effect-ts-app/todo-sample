import { Task } from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"

import { UserSVC } from "@/services"

import * as UserContext from "../Temp/UserContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/CreateTask"

export const handle = ({ folderId, ..._ }: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)
    //const user = yield* $(UserContext.get(u.id))
    const t = Task.create({ ..._, steps: [] })
    yield* $(UserContext.addTask(u.id, folderId, t))
    return { id: t.id }
  })

export { Request, Response }
