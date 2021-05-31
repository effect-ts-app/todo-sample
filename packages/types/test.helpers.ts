import * as MO from "@effect-ts-app/core/Schema"

import { UserId } from "./ids"

export const userId = MO.Constructor.for(UserId)
export const userIdUnsafe = userId["|>"](MO.unsafe)

export * from "@effect-ts-app/core/test.helpers"
