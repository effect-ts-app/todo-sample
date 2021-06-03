/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"

import { LiveConfig } from "@/_services/Config"
import { TodoContext } from "@/services"

import { app } from "./app"

const PORT = getRandomInt(33111, 39999)
const ADDR = "127.0.0.1"

const program = pipe(app, T.zipRight(T.never))

export function startTestServer(host: string, port: number) {
  return pipe(
    program,
    T.provideSomeLayer(Ex.LiveExpress(host, port)),
    T.provideSomeLayer(TodoContext.MockTodoContext)
  )
}

export function managedServer() {
  const managedServer = L.fromRawManaged(
    pipe(startTestServer("127.0.0.1", PORT), T.forkManaged)
  )
  return {
    URL: `http://${ADDR}:${PORT}`,
    PORT,
    server: managedServer["<+<"](LiveConfig({ AUTH_DISABLED: true, PORT, HOST: ADDR })),
  }
}

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
