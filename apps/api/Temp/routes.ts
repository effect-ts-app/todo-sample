import * as T from "@effect-ts/core/Effect"

import * as R from "@/routing"

import * as GetMe from "./GetMe"
import * as GetTaskList from "./GetTaskList"

export const routes = T.tuple(
  R.get("/me", GetMe),
  R.get("/task-lists/:listId", GetTaskList)
)
