import { identity, pipe } from "@effect-ts/core/Function"
import type { IntersectionURI } from "@effect-ts/morphic/Algebra/Intersection"
import { interpreter } from "@effect-ts/morphic/HKT"

import * as X from "../base"

export const SchemaIntersectionInterpreter = interpreter<
  X.SchemaURI,
  IntersectionURI
>()(() => ({
  _F: X.SchemaURI,
  intersection: (...types) => (config) => (env) => {
    const Schemaes = types.map((getSchema) => getSchema(env).Schema)
    return new X.SchemaType(
      X.SchemaApplyConfig(config?.conf)(
        pipe(
          Schemaes,
          X.forEach(identity),
          X.chain((allOf) => X.succeed({ allOf }))
        ),
        env,
        {
          Schemaes: Schemaes as any
        }
      )
    )
  }
}))
