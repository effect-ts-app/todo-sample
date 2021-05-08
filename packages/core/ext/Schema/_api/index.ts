export * from "./asBuilder"

export * from "./Void"
import { makeUuid } from "@effect-ts-demo/core/ext/Model"

import * as S from "../vendor"

export const withDefaultUuidId = S.withDefaultConstructorField("id", makeUuid)
