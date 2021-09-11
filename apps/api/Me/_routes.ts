import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as R from "@effect-ts-app/infra/express/routing"

import { demandLoggedIn } from "@/middleware"

import GetMe from "./Index"

export const routes = T.tuple(R.match(GetMe, demandLoggedIn))["|>"](
  T.map((x) =>
    A.map_(x.tuple, (i) => ({
      ...i,
      info: {
        tags: ["Me"],
      },
    }))
  )
)
