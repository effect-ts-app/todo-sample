import * as T from "@effect-ts/core/Effect"

import * as RS from "@/routingSchema"

import * as GetMe from "./GetMe"

export const routes = T.tuple(RS.get("/me", GetMe))
