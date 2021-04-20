import * as T from "@effect-ts/core/Effect"

import * as R from "@/routing"

import * as CreateTask from "./CreateTask"
import * as DeleteTask from "./DeleteTask"
import * as GetTask from "./GetTask"
import * as GetTasks from "./GetTasks"
import * as SetTasksOrder from "./SetTasksOrder"
import * as UpdateTask from "./UpdateTask"

export const routes = T.tuple(
  R.get("/tasks", GetTasks),
  R.post("/tasks", CreateTask),
  R.get("/tasks/:id", GetTask),
  R.patch("/tasks/:id", UpdateTask),
  R.delete("/tasks/:id", DeleteTask),
  R.post("/tasks-order", SetTasksOrder)
)
