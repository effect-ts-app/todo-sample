export * from "./_index"
import { clientFor } from "../clientFor"

import * as Ts from "./_index"

export * from "./GetMe"
export * from "@effect-ts-demo/todo-types"

export const { index } = clientFor(Ts)
