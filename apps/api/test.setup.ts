/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"

import { LiveConfig } from "@/_services/Config"
import { startTestServer } from "@/start-test-server"

const PORT = getRandomInt(33111, 39999)
const ADDR = "127.0.0.1"

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
