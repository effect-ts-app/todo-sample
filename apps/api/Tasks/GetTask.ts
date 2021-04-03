import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTask"

import * as TaskContext from "./TaskContext"

export const handle = (_: Request) => TaskContext.find(_.id)

export { Request, Response }
