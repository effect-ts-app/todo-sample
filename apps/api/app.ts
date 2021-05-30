import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import * as TUP from "@effect-ts-app/core/ext/Tuple"
import * as R from "@effect-ts-app/infra/express/schema/routing"
import { json, urlencoded } from "body-parser"
import cors from "cors"

import { routes as meRoutes } from "./Me/_routes"
import * as Middleware from "./middleware"
import { routes as taskListRoutes } from "./TaskLists/_routes"
import { routes as taskRoutes } from "./Tasks/_routes"

export const app = pipe(
  Middleware.openapiRoutes["|>"](
    T.zipRight(
      T.tuple(
        Middleware.auth,
        Ex.use(Ex.classic(cors())),
        Ex.use(Ex.classic(urlencoded({ extended: false }))),
        Ex.use(Ex.classic(json()))
      )
    )
  ),
  T.zipRight(
    T.tuple(
      meRoutes["|>"](T.map(R.arrAsRouteDescriptionAny)),
      taskRoutes["|>"](T.map(R.arrAsRouteDescriptionAny)),
      taskListRoutes["|>"](T.map(R.arrAsRouteDescriptionAny))
    )["|>"](T.map(TUP.flattenArray))
  )
)
