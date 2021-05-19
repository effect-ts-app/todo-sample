export * from "./_index"
import { clientFor } from "../clientFor"

import * as Ts from "./_index"

export const { all, create, find, remove, update } = clientFor(Ts)
