import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"

import * as UserContext from "../Temp/UserContext"

import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/DeleteTask"

export const handle = (_: Request) => pipe(UserContext.deleteTask(_.id), T.asUnit)

export { Request, Response }
