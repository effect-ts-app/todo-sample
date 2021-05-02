import * as TaskContext from "./TaskContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTask"

export const handle = (_: Request) => TaskContext.find(_.id)

export { Request, Response }
