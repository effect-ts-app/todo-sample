import * as Plutus from "@atlas-ts/plutus"
import { JSONSchema, SubSchema } from "@atlas-ts/plutus/JsonSchema"
import { References } from "@atlas-ts/plutus/Schema"
import * as T from "@effect-ts/core/Effect"
import { makeRef } from "@effect-ts/core/Effect/Ref"

import { makeJsonSchema } from "./makeJsonSchema"
import { RouteDescriptorAny } from "./schema/routing"
export function makeOpenApiSpecs(
  rdescs: Iterable<RouteDescriptorAny>,
  info: Plutus.Info
) {
  return T.gen(function* ($) {
    const ref = yield* $(makeRef<Map<string, JSONSchema | SubSchema>>(new Map()))
    const withRef = T.provideService(References)({ ref })
    const paths = yield* $(makeJsonSchema(rdescs)["|>"](withRef))
    const refs = yield* $(ref.get)
    const parameterRefs: Record<string, any> = {} // todos
    const schemas: Record<string, any> = {}
    const securitySchemes = {} // { basicAuth: { type: "http", scheme: "basic" } }
    const components = { securitySchemes, schemas, parameters: parameterRefs }

    for (const entry of refs.entries()) {
      schemas[entry[0]] = entry[1]
    }

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
      tags: [
        {
          name: "Tasks",
          description: "Everything Tasks related",
        },
        { name: "Lists", description: "Everything about the Task Lists" },
        { name: "Groups", description: "Everything about the Task List Group" },
      ],
      paths,
      components,
      //test,
    }
  })
}
