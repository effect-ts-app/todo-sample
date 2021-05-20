import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import * as N from "@effect-ts/node/Runtime"

import { TodoContext } from "@/services"

import { app } from "./app"
import * as cfg from "./config"
import { writeOpenapiDocs } from "./writeDocs"

const program = pipe(
  app,
  T.tap(writeOpenapiDocs),
  T.zipRight(
    T.succeedWith(() => {
      console.log(`Running on ${cfg.HOST}:${cfg.PORT}`)
    })
  ),
  T.tap(() => T.never)
)

pipe(
  program,
  T.provideSomeLayer(Ex.LiveExpress(cfg.HOST, parseInt(cfg.PORT))),
  T.provideSomeLayer(TodoContext.MockTodoContext),
  N.runMain
)
