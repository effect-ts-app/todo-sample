import { identity, pipe } from "@effect-ts/core/Function"
import type { UnionURI } from "@effect-ts/morphic/Algebra/Union"
import { interpreter } from "@effect-ts/morphic/HKT"

import * as X from "../base"

export const SchemaUnionInterpreter = interpreter<X.SchemaURI, UnionURI>()(() => ({
  _F: X.SchemaURI,
  union: (...types) => (_, config) => (env) => {
    const Schemaes = types.map((a) => a(env).Schema)
    return new X.SchemaType(
      X.SchemaApplyConfig(config?.conf)(
        pipe(
          types.map((t) => t(env).Schema),
          X.foreach(identity),
          X.chain((oneOf) => X.succeed({ oneOf }))
        ),
        env,
        {
          Schemaes: Schemaes as any
        }
      )
    )
  }
}))
