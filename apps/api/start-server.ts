import fs from "fs"

import { JSONSchema, SubSchema } from "@atlas-ts/plutus/JsonSchema"
import { References } from "@atlas-ts/plutus/Schema"
import * as T from "@effect-ts/core/Effect"
import { makeRef } from "@effect-ts/core/Effect/Ref"
import { constVoid, pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import * as N from "@effect-ts/node/Runtime"
import { urlencoded, json } from "body-parser"
import cors from "cors"

import { makeSchema } from "@/routing"

import { routes as taskRoutes } from "./Tasks/routes"

const HOST = "127.0.0.1"
const PORT = 3330

const program = pipe(
  T.tuple(
    Ex.use(Ex.classic(cors())),
    Ex.use(Ex.classic(urlencoded({ extended: false }))),
    Ex.use(Ex.classic(json()))
  ),
  T.zipRight(taskRoutes),
  T.tap((r) =>
    pipe(
      T.succeedWith(() => {
        console.log(`Running on ${HOST}:${PORT}`)
      }),
      T.zipRight(
        T.gen(function* ($) {
          const ref = yield* $(makeRef<Map<string, JSONSchema | SubSchema>>(new Map()))
          const withRef = T.provideService(References)({ ref })
          const _ = yield* $(makeSchema(r)["|>"](withRef))
          const js = JSON.stringify(_, undefined, 2)
          return js
        })
      ),
      T.tap((_) =>
        T.effectAsync((cb) =>
          fs.writeFile("./schema.json", _, "utf-8", (err) =>
            err ? cb(T.fail(err)) : cb(T.succeed(constVoid()))
          )
        )["|>"](T.orDie)
      ),
      T.map((jsSchema) => {
        console.log("Available routes: ", jsSchema)
      })
    )
  ),
  T.tap(() => T.never)
)

pipe(program, T.provideSomeLayer(Ex.LiveExpress(HOST, PORT)), N.runMain)
