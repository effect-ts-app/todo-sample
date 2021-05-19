import { RouteDescriptorAny } from "@effect-ts-app/infra/express/schema/routing"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import * as N from "@effect-ts/node/Runtime"

import { routes as meRoutes } from "./Me/routes"
import { routes as taskListRoutes } from "./TaskLists/routes"
import { routes as taskRoutes } from "./Tasks/routes"
import { MockTodoContext } from "./TodoContext"
import * as cfg from "./config"
import { middlewares } from "./middleware"
import { writeOpenapiDocs } from "./writeDocs"

const program = pipe(
  middlewares,
  T.zipRight(
    T.tuple(
      meRoutes["|>"](T.map((x) => x as A.Array<RouteDescriptorAny>)),
      taskRoutes["|>"](T.map((x) => x as A.Array<RouteDescriptorAny>)),
      taskListRoutes["|>"](T.map((x) => x as A.Array<RouteDescriptorAny>))
    )
  ),
  T.map(({ tuple }) => A.flatten(tuple)),
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
  T.provideSomeLayer(MockTodoContext),
  N.runMain
)
