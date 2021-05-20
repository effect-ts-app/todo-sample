import { RouteDescriptorAny } from "@effect-ts-app/infra/express/schema/routing"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import { urlencoded, json } from "body-parser"
import cors from "cors"

import { routes as loggedInRoutes } from "./LoggedInSamples/routes"
import { routes as sampleRoutes } from "./Samples/routes"
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
      loggedInRoutes["|>"](T.map((x) => x.tuple as A.Array<RouteDescriptorAny>)),
      sampleRoutes["|>"](T.map((x) => x.tuple as A.Array<RouteDescriptorAny>))
    )
  ),
  T.map(({ tuple }) => A.flatten(tuple))
)
