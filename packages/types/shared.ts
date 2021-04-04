import type { Branded } from "@effect-ts/core/Branded"
import * as Sy from "@effect-ts/core/Sync"
import {
  make,
  FastCheckURI,
  AType,
  DecoderURI,
  EncoderURI,
  opaque,
} from "@effect-ts/morphic"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { v4 } from "uuid"

export function makeUuid() {
  return v4() as UUID
}

const MIN = 1

export const isNonEmptyString = (
  v: string
): v is Branded<string, NonEmptyStringBrand> => v.length >= MIN

/**
 * A string of Min 1 and Max 256KB characters
 */
export const NonEmptyString = make((F) =>
  F.refined(F.string(), isNonEmptyString, {
    name: "NonEmptyString",
    conf: {
      [FastCheckURI]: (_c, fc) =>
        fc.module
          .string({ minLength: MIN })
          .map((x) => x as Branded<string, NonEmptyStringBrand>),
      //[DecoderURI]: withMessage(() => "is not a NonEmpty String"),
    },
  })
)
export interface NonEmptyStringBrand {
  readonly NonEmptyString: unique symbol
}
export type NonEmptyString = AType<typeof NonEmptyString>

const Void_ = make((F) =>
  F.unknown({
    conf: {
      [DecoderURI]: (codec) => codec.with(() => Sy.succeed(void 0)),
      [EncoderURI]: () => ({ encode: () => Sy.succeed(void 0) }),
    },
  })
)
export type Void = void

export const Void = opaque<Void, Void>()(Void_ as any)
