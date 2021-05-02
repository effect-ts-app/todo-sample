import * as UserContext from "../Temp/UserContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTask"

export const handle = (_: Request) => UserContext.findTask(_.id)

export { Request, Response }
