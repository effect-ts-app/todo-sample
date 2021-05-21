import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as R from "@effect-ts-app/infra/express/schema/routing"

import { demandLoggedIn } from "@/middleware"

import AddMember from "./Members/Add"
import RemoveMember from "./Members/Remove"
import Remove from "./Remove"
import CreateTask from "./Tasks/Create"
import Update from "./Update"
import UpdateGroup from "./UpdateGroup"
import UpdateOrder from "./UpdateOrder"

export const routes = T.tuple(
  R.match(CreateTask, demandLoggedIn),
  R.match(Update, demandLoggedIn),
  R.match(UpdateOrder, demandLoggedIn),
  R.match(Remove, demandLoggedIn),
  R.match(AddMember, demandLoggedIn),
  R.match(RemoveMember, demandLoggedIn),

  R.match(UpdateGroup, demandLoggedIn)
)["|>"](
  T.map((x) =>
    A.map_(x.tuple, (i) => ({
      ...i,
      info: {
        tags: [i.path.startsWith("/lists") ? "Lists" : "Groups"],
      },
    }))
  )
)
