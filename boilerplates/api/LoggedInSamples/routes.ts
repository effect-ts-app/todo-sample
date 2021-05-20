import { demandLoggedIn } from "@/middleware"
import * as R from "@effect-ts-app/infra/express/schema/routing"
import * as T from "@effect-ts/core/Effect"

import All from "./All"
import Find from "./Find"

export const routes = T.tuple(
  R.match(All, demandLoggedIn),
  R.match(Find, demandLoggedIn)
)
