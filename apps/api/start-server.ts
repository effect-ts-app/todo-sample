import fs from "fs"

import * as Plutus from "@atlas-ts/plutus"
import * as T from "@effect-ts/core/Effect"
import { constVoid, pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import * as N from "@effect-ts/node/Runtime"
import { urlencoded, json } from "body-parser"
import cors from "cors"
import redoc from "redoc-express"
import { setup, serve } from "swagger-ui-express"

import { MockTaskContext } from "./Tasks/TaskContext"
import { routes as taskRoutes } from "./Tasks/routes"

import { makeOpenApiSpecs } from "@effect-ts-demo/infra/express/makeOpenApiSpecs"
import { RouteDescriptorAny } from "@effect-ts-demo/infra/express/schema/routing"
import pkg from "package.json"

const HOST = "127.0.0.1"
const PORT = 3330

const readOpenApiDoc = T.effectAsync((cb) =>
  fs.readFile("./openapi.json", "utf-8", (err, d) =>
    err ? cb(T.fail(err)) : cb(T.succeed(d))
  )
)["|>"](T.orDie)

const openapiRoutes = T.tuple(
  Ex.get("/openapi.json", (_req, res) =>
    readOpenApiDoc["|>"](T.map((js) => res.send(js)))
  ),
  Ex.get(
    "/docs",
    Ex.classic(
      redoc({
        title: "API Docs",
        specUrl: "./openapi.json",
      })
    )
  ),

  Ex.use(...serve.map(Ex.classic)),
  Ex.get("/swagger", (req, res, next) =>
    readOpenApiDoc["|>"](
      T.chain((docs) =>
        T.succeedWith(() =>
          setup(docs, { swaggerOptions: { url: "./openapi.json" } })(req, res, next)
        )
      )
    )
  )
)

const program = pipe(
  // Host some classic middleware
  T.tuple(
    Ex.use(Ex.classic(cors())),
    Ex.use(Ex.classic(urlencoded({ extended: false }))),
    Ex.use(Ex.classic(json()))
  ),
  // Host our app
  T.zipRight(taskRoutes),
  // Write our docs
  T.tap(writeOpenapiDocs),
  // Host our openapi docs
  T.zipRight(openapiRoutes),
  T.zipRight(
    T.succeedWith(() => {
      console.log(`Running on ${HOST}:${PORT}`)
    })
  ),
  T.tap(() => T.never)
)

pipe(
  program,
  T.provideSomeLayer(Ex.LiveExpress(HOST, PORT)),
  T.provideSomeLayer(MockTaskContext),
  N.runMain
)

function writeOpenapiDocs(rdescs: Iterable<RouteDescriptorAny>) {
  return pipe(
    // Write our openapi docs.
    makeOpenApiSpecs(
      rdescs,
      Plutus.info({
        title: pkg.name,
        version: pkg.version,
        pageTitle: pkg.name,
      })
    ),
    T.tap((_) =>
      T.effectAsync((cb) =>
        fs.writeFile(
          "./openapi.json",
          JSON.stringify(_, undefined, 2),
          "utf-8",
          (err) => (err ? cb(T.fail(err)) : cb(T.succeed(constVoid())))
        )
      )["|>"](T.orDie)
    ),
    T.tap(() =>
      T.succeedWith(() => console.log("OpenAPI spec written to './openapi.json'"))
    )
  )
}
