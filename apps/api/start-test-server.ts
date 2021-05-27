import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"

import { TodoContext } from "@/services"

import { app } from "./app"

const program = pipe(
  app,
  T.chain(() => T.never)
)

export function startTestServer(host: string, port: number) {
  return pipe(
    program,
    T.provideSomeLayer(Ex.LiveExpress(host, port)),
    T.provideSomeLayer(TodoContext.MockTodoContext)
  )
}
