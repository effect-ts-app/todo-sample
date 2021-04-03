import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import cors from "cors"

import { routes as taskRoutes } from "./Tasks/routes"

const HOST = "127.0.0.1"
const PORT = 3330

const program = pipe(
  Ex.use(Ex.classic(cors())),
  T.zipRight(taskRoutes),
  T.tap(() => T.effectTotal(() => console.log(`Running on ${HOST}:${PORT}`))),
  T.tap(() => T.never)
)

pipe(program, T.provideSomeLayer(Ex.LiveExpress(HOST, PORT)), T.runPromiseExit)
  .then(console.log)
  .catch(console.error)
