export * from "./_index"
import { clientFor } from "../clientFor"

import * as Ts from "./_index"

export const { createTask, remove, update, updateGroup, updateOrder } = clientFor(Ts)
