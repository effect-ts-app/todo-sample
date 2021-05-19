import * as Plutus from "@effect-ts-app/infra/Openapi/atlas-plutus"
import { makeOpenApiSpecs } from "@effect-ts-app/infra/express/makeOpenApiSpecs"
import { RouteDescriptorAny } from "@effect-ts-app/infra/express/schema/routing"
import { writeTextFile } from "@effect-ts-app/infra/simpledb/fileutil"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"

import pkg from "package.json"

export function writeOpenapiDocs(rdescs: Iterable<RouteDescriptorAny>) {
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
    T.map((_) => ({
      ..._,
      // TODO: Export tags as part of modules?
      tags: [
        {
          name: "Tasks",
          description: "Everything Tasks related",
        },
        { name: "Lists", description: "Everything about the Task Lists" },
        { name: "Groups", description: "Everything about the Task List Group" },
      ],
    })),
    T.tap((_) =>
      writeTextFile("./openapi.json", JSON.stringify(_, undefined, 2))["|>"](T.orDie)
    ),
    T.tap(() =>
      T.succeedWith(() => console.log("OpenAPI spec written to './openapi.json'"))
    )
  )
}
