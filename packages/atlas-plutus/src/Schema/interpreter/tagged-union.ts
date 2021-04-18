import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import type { TaggedUnionURI } from "@effect-ts/morphic/Algebra/TaggedUnion"
import { interpreter } from "@effect-ts/morphic/HKT"
import { mapRecord } from "@effect-ts/morphic/Utils"

import { isTypeRef } from "../../JsonSchema"
import * as X from "../base"

export const SchemaTaggedUnionInterpreter = interpreter<X.SchemaURI, TaggedUnionURI>()(
  () => ({
    _F: X.SchemaURI,
    taggedUnion: (_tag, types, config) => (env) => {
      const Schemaes: X.Schema[] = Object.values(
        mapRecord(types as any, (a) => a(env).Schema)
      )
      return new X.SchemaType(
        X.SchemaApplyConfig(config?.conf)(
          pipe(
            Schemaes,
            X.foreach((s) =>
              T.chain_(s, (a) =>
                isTypeRef(a)
                  ? T.succeed(a)
                  : X.dieMessage(
                      "To use taggedUnion all members must have an openapiRef"
                    )
              )
            ),
            X.chain((oneOf) => {
              return X.succeed({
                oneOf,
                discriminator: { propertyName: _tag }
              })
            })
          ),
          env,
          {
            Schemaes: Schemaes as any
          }
        )
      )
    }
  })
)
