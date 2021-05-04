import * as T from "@effect-ts/core/Effect"

import { UserSVC } from "@/services"

import * as TaskContext from "./TaskContext"

export const getLoggedInUser = T.gen(function* ($) {
  const u = yield* $(UserSVC.UserEnv)
  return yield* $(TaskContext.getUser(u.id))
})
