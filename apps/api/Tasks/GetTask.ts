import { Request, Response } from "@effect-ts-demo/todo-client/Tasks/GetTask"
import * as T from "@effect-ts/core/Effect"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    return yield* $(T.succeed(Response.build({ tasks: [] })))
  })

export { Request, Response }
