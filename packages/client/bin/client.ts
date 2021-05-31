/* eslint-disable @typescript-eslint/no-explicit-any */
import * as L from "@effect-ts/core/Effect/Layer"
import * as N from "@effect-ts/node/Runtime"
import * as T from "@effect-ts-app/core/Effect"
import { pipe } from "@effect-ts-app/core/Function"
import * as HF from "@effect-ts-app/core/http/http-client-fetch"
import { uuidUnsafe } from "@effect-ts-app/core/test.helpers"
import { LiveApiConfig } from "@effect-ts-demo/todo-client/config"
import fetch from "cross-fetch"

import { Tasks } from ".."

function run(cmd: string, args: string[]) {
  switch (cmd) {
    case "all": {
      return Tasks.all
    }
    case "findTask": {
      return Tasks.find({ id: uuidUnsafe(args[0]) })
    }
    default: {
      return T.succeedWith(() => "Unknown command: " + cmd)
    }
  }
}

const printJson = (i: unknown) => console.log(JSON.stringify(i, undefined, 2))
const printJsonM = (i: unknown) => T.succeedWith(() => printJson(i))

const Env = L.all(
  LiveApiConfig({
    apiUrl: "http://localhost:3330",
    userProfileHeader: JSON.stringify({
      sub: "0",
    }),
  }),
  HF.Client(fetch)
)

pipe(
  run(process.argv[2], process.argv.slice(3))["|>"](T.chain(printJsonM)),
  T.provideSomeLayer(Env),
  N.runMain
)
