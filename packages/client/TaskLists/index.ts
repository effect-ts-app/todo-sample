import { clientFor } from "../clientFor"
import * as Ts from "./_index"

export * from "./_index"

export const { createTask, remove, update, updateGroup, updateOrder } = clientFor(Ts)
