import { readTextFile } from "@effect-ts-app/infra/simpledb/fileutil"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import { urlencoded, json } from "body-parser"
import cors from "cors"
import jwt from "express-jwt"
import jwtAuthz from "express-jwt-authz"
import jwksRsa from "jwks-rsa"
import redoc from "redoc-express"
import { setup, serve } from "swagger-ui-express"

import * as cfg from "./config"

const readOpenApiDoc = readTextFile("./openapi.json")["|>"](T.orDie)

const openapiRoutes = T.tuple(
  // TODO: just use staticfile middleware?
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

export const middlewares = pipe(
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
  )
)
