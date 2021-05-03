import * as TaskContext from "./TaskContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/DeleteTask"

export const handle = (_: Request) => TaskContext.delete(_.id)

export { Request, Response }
