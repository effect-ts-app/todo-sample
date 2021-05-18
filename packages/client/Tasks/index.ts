export * from "./_index"
import { clientFor } from "../clientFor"

import * as Ts from "./_index"

export { TaskView as Task } from "./views"
export * from "./GetMe"
export * from "@effect-ts-demo/todo-types"

export const { all, create, find, getMe, remove, update } = clientFor(Ts)
