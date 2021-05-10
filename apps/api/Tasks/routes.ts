import * as T from "@effect-ts/core/Effect"

import CreateTask from "./CreateTask"
import DeleteTask from "./DeleteTask"
import FindTask from "./FindTask"
import GetMe from "./GetMe"
import GetTasks from "./GetTasks"
import SetTasksOrder from "./SetTasksOrder"
import UpdateTask from "./UpdateTask"

import { demandLoggedIn } from "@effect-ts-demo/infra/express/schema/requestHandler"
import * as R from "@effect-ts-demo/infra/express/schema/routing"

export const routes = T.tuple(
  R.get("/me", GetMe, demandLoggedIn),
  R.get("/tasks", GetTasks, demandLoggedIn),
  R.post("/tasks", CreateTask, demandLoggedIn),
  R.get("/tasks/:id", FindTask, demandLoggedIn),
  R.patch("/tasks/:id", UpdateTask, demandLoggedIn),
  R.delete("/tasks/:id", DeleteTask, demandLoggedIn),
  R.post("/tasks-order", SetTasksOrder, demandLoggedIn)
)
