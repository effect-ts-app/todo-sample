import { RouteDescriptorAny } from "@effect-ts-app/infra/express/schema/routing"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import { urlencoded, json } from "body-parser"
import cors from "cors"

import { routes as meRoutes } from "./Me/_routes"
import { routes as taskListRoutes } from "./TaskLists/_routes"
import { routes as taskRoutes } from "./Tasks/_routes"
import * as Middleware from "./middleware"

export const app = pipe(
  Middleware.openapiRoutes,
  T.zipRight(
    T.tuple(
      Middleware.auth,
      Ex.use(Ex.classic(cors())),
      Ex.use(Ex.classic(urlencoded({ extended: false }))),
      Ex.use(Ex.classic(json()))
    )
  ),
  T.zipRight(
    T.tuple(
      meRoutes["|>"](T.map((x) => x as A.Array<RouteDescriptorAny>)),
      taskRoutes["|>"](T.map((x) => x as A.Array<RouteDescriptorAny>)),
      taskListRoutes["|>"](T.map((x) => x as A.Array<RouteDescriptorAny>))
    )
  ),
  T.map(({ tuple }) => A.flatten(tuple))
)
