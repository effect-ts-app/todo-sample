import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/express"

import { makeRequestHandler } from "@/requestHandler"

import * as CreateTask from "./CreateTask"
import * as GetTask from "./GetTask"
import * as GetTasks from "./GetTasks"
import * as UpdateTask from "./UpdateTask"

export const routes = T.tuple(
  Ex.get("/tasks/:id", makeRequestHandler(GetTask)),
  Ex.get("/tasks", makeRequestHandler(GetTasks)),
  Ex.post("/tasks/:id", makeRequestHandler(UpdateTask)),
  Ex.post("/tasks", makeRequestHandler(CreateTask))
)
