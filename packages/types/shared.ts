import type { Branded } from "@effect-ts/core/Branded"
import { make, FastCheckURI, AType } from "@effect-ts/morphic"

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
