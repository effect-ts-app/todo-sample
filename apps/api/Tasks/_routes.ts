import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as R from "@effect-ts-app/infra/express/routing"

import { demandLoggedIn } from "@/middleware"

import All from "./All"
import Create from "./Create"
import Find from "./Find"
import Remove from "./Remove"
import Search from "./Search"
import Update from "./Update"

export const routes = T.tuple(
  R.match(Search, demandLoggedIn),
  R.match(All, demandLoggedIn),
  R.match(Create, demandLoggedIn),
  R.match(Find, demandLoggedIn),
  R.match(Update, demandLoggedIn),
  R.match(Remove, demandLoggedIn)
)["|>"](
  T.map((x) =>
    A.map_(x.tuple, (i) => ({
      ...i,
      info: {
        tags: ["Tasks"],
      },
    }))
  )
)
