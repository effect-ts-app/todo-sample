import * as T from "@effect-ts/core/Effect"

import * as CreateTask from "./CreateTask"
import * as DeleteTask from "./DeleteTask"
import * as FindTask from "./FindTask"
import * as GetMe from "./GetMe"
import * as GetTasks from "./GetTasks"
import * as SetTasksOrder from "./SetTasksOrder"
import * as UpdateTask from "./UpdateTask"

import * as R from "@effect-ts-demo/infra/express/schema/routing"

export const routes = T.tuple(
  R.get("/me", GetMe),
  R.get("/tasks", GetTasks),
  R.post("/tasks", CreateTask),
  R.get("/tasks/:id", FindTask),
  R.patch("/tasks/:id", UpdateTask),
  R.delete("/tasks/:id", DeleteTask),
  R.post("/tasks-order", SetTasksOrder)
)
