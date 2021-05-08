import * as T from "@effect-ts/core/Effect"

import * as RS from "@/routingSchema"

import * as CreateTask from "./CreateTask"
import * as DeleteTask from "./DeleteTask"
import * as GetTask from "./GetTask"
import * as GetTasks from "./GetTasks"
import * as SetTasksOrder from "./SetTasksOrder"
import * as UpdateTask from "./UpdateTask"

export const routes = T.tuple(
  RS.get("/tasks", GetTasks),
  RS.post("/tasks", CreateTask),
  RS.get("/tasks/:id", GetTask),
  RS.patch("/tasks/:id", UpdateTask),
  RS.delete("/tasks/:id", DeleteTask),
  RS.post("/tasks-order", SetTasksOrder)
)
