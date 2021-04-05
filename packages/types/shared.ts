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
import { decode } from "@effect-ts/morphic/Decoder"
import { flow } from "@effect-ts/system/Function"
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
const NonEmptyStringO = make((F) =>
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
export const NonEmptyString = Object.assign(NonEmptyStringO, {
  parse: flow((s: string) => s, decode(NonEmptyStringO)),
})
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Void = opaque<Void, Void>()(Void_ as any)

export class NotFoundError {
  public readonly _tag = "NotFoundError"
  public readonly message: string
  constructor(type: string, id: string) {
    this.message = `Didn't find ${type}#${id}`
  }
}
