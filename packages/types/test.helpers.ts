import * as S from "@effect-ts-app/core/Schema"

import { UserId } from "./ids"

export const userId = S.Constructor.for(UserId)
export const userIdUnsafe = userId["|>"](S.unsafe)

export * from "@effect-ts-app/core/test.helpers"
