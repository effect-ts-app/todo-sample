import { clientFor } from "../clientFor"
import * as Ts from "./_index"

export const { all, create, find, remove, search, update } = clientFor(Ts)

export * from "./_custom"

export * from "./_index"
