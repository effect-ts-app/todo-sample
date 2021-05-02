import * as T from "@effect-ts/core/Effect"

import * as R from "@/routing"

import * as GetMe from "./GetMe"

export const routes = T.tuple(R.get("/me", GetMe))
