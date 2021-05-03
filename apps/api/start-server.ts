import fs from "fs"

import * as Plutus from "@atlas-ts/plutus"
import { JSONSchema, SubSchema } from "@atlas-ts/plutus/JsonSchema"
import { References } from "@atlas-ts/plutus/Schema"
import * as T from "@effect-ts/core/Effect"
import { makeRef } from "@effect-ts/core/Effect/Ref"
import { constVoid, pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import * as N from "@effect-ts/node/Runtime"
import { urlencoded, json } from "body-parser"
import cors from "cors"
import redoc from "redoc-express"
import { setup, serve } from "swagger-ui-express"

import { makeSchema } from "@/routing"

import { MockTaskContext } from "./Tasks/TaskContext"
import { routes as taskRoutes } from "./Tasks/routes"
import { routes as tempRoutes } from "./Temp/routes"

import pkg from "package.json"

const HOST = "127.0.0.1"
const PORT = 3330

const readOpenApiDoc = T.effectAsync((cb) =>
  fs.readFile("./openapi.json", "utf-8", (err, d) =>
    err ? cb(T.fail(err)) : cb(T.succeed(d))
  )
)["|>"](T.orDie)

const program = pipe(
  T.tuple(
    Ex.use(Ex.classic(cors())),
    Ex.use(Ex.classic(urlencoded({ extended: false }))),
    Ex.use(Ex.classic(json()))
  ),
  T.zipRight(
    T.tuple(
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
  ),
  T.zipRight(T.tuple(taskRoutes, tempRoutes)),
  T.map(({ tuple: [tr, tr2] }) => [...tr.tuple, ...tr2.tuple]),
  T.tap((rdescs) =>
    pipe(
      T.succeedWith(() => {
        console.log(`Running on ${HOST}:${PORT}`)
      }),
      T.zipRight(
        T.gen(function* ($) {
          const ref = yield* $(makeRef<Map<string, JSONSchema | SubSchema>>(new Map()))
          const withRef = T.provideService(References)({ ref })
          const paths = yield* $(makeSchema(rdescs)["|>"](withRef))
          const refs = yield* $(ref.get)
          const parameterRefs: Record<string, any> = {} // todos
          const schemas: Record<string, any> = {}
          const securitySchemes = {} // { basicAuth: { type: "http", scheme: "basic" } }
          const components = { securitySchemes, schemas, parameters: parameterRefs }

          for (const entry of refs.entries()) {
            schemas[entry[0]] = entry[1]
          }

          //const test = yield* $(generatePlutus)

          const info = Plutus.info({
            title: pkg.name,
            version: pkg.version,
            pageTitle: pkg.name,
          })
          //            tags: Plutus.tags(Plutus.tag({ name: "Who", description: "Who dunnut" })),
          //        })

          return {
            openapi: "3.0.0",
            info: {
              title: info.title,
              description: info.description,
              termsOfService: info.tos,
              contact: info.contact
                ? {
                    name: info.contact.name,
                    email: info.contact.email,
                    url: info.contact.url,
                  }
                : undefined,
              license: info.license
                ? {
                    name: info.license.name,
                    url: info.license.url,
                  }
                : undefined,
              version: info.version,
            },
            //tags,
            paths,
            components,
            //test,
          }
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
  ),
  T.tap(() => T.never)
)

pipe(
  program,
  T.provideSomeLayer(Ex.LiveExpress(HOST, PORT)),
  T.provideSomeLayer(MockTaskContext),
  N.runMain
)
