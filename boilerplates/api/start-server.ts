import fs from "fs"

import * as Plutus from "@effect-ts-app/infra/Openapi/atlas-plutus"
import { makeOpenApiSpecs } from "@effect-ts-app/infra/express/makeOpenApiSpecs"
import { RouteDescriptorAny } from "@effect-ts-app/infra/express/schema/routing"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import { constVoid, pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import * as N from "@effect-ts/node/Runtime"
import { urlencoded, json } from "body-parser"
import cors from "cors"
import jwt from "express-jwt"
import jwtAuthz from "express-jwt-authz"
import jwksRsa from "jwks-rsa"
import redoc from "redoc-express"
import { setup, serve } from "swagger-ui-express"

import { routes as loggedInRoutes } from "./LoggedInSamples/routes"
import { routes as sampleRoutes } from "./Samples/routes"
import * as cfg from "./config"
import pkg from "./package.json"

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

// Authorization middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://effect-ts-demo.eu.auth0.com/.well-known/jwks.json`,
  }),

  // Validate the audience and the issuer.
  audience: "http://localhost:3330/api/proxy",
  issuer: ["https://effect-ts-demo.eu.auth0.com/"],
  algorithms: ["RS256"],
})
//const checkScopes = jwtAuthz(["read:tasks"])

const auth = cfg.AUTH_DISABLED
  ? T.unit
  : T.tuple(
      Ex.use(Ex.classic(checkJwt)),
      Ex.use(Ex.classic(jwtAuthz(["read:tasks"]))) // TODO
    )

const program = pipe(
  // Host our openapi docs
  openapiRoutes,
  // Host some classic middleware
  T.zipRight(
    T.tuple(
      auth,
      Ex.use(Ex.classic(cors())),
      Ex.use(Ex.classic(urlencoded({ extended: false }))),
      Ex.use(Ex.classic(json()))
    )
  ),
  // Host our app
  T.zipRight(
    T.tuple(
      loggedInRoutes["|>"](T.map((x) => x.tuple as A.Array<RouteDescriptorAny>)),
      sampleRoutes["|>"](T.map((x) => x.tuple as A.Array<RouteDescriptorAny>))
    )
  ),
  T.map(({ tuple }) => A.flatten(tuple)),
  // Write our docs
  T.tap(writeOpenapiDocs),
  T.zipRight(
    T.succeedWith(() => {
      console.log(`Running on ${cfg.HOST}:${cfg.PORT}`)
    })
  ),
  T.tap(() => T.never)
)

pipe(
  program,
  T.provideSomeLayer(Ex.LiveExpress(cfg.HOST, parseInt(cfg.PORT))),
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
