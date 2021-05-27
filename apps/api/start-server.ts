import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import * as N from "@effect-ts/node/Runtime"

import { TodoContext } from "@/services"

import { LiveConfig } from "./_services/Config"
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
  T.provideSomeLayer(
    L.all(
      Ex.LiveExpress(cfg.HOST, cfg.PORT),
      TodoContext.MockTodoContext["<+<"](LiveConfig(cfg))
    )
  ),
  N.runMain
)
