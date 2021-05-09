import type { Branded } from "@effect-ts/core/Branded"
import { constVoid } from "@effect-ts/core/Function"
import * as Sy from "@effect-ts/core/Sync"
import { IntBrand, PositiveBrand } from "@effect-ts/schema"

import type { Arbitrary, FC } from "../FastCheck"
import { flow, pipe } from "../Function"
import * as V from "../validation"

import {
  AType,
  make,
  FastCheckURI,
  castBrand,
  DecoderURI,
  extend,
  withMessage,
  EncoderURI,
  opaque,
} from "./model"

export const UUID = make((F) => F.uuid())
export type UUID = AType<typeof UUID>

export type { Branded }

// TODO: Arbitraries should still be cut/filtered on max and min lengths

const MIN = 1
type NonEmptyStringBranded = Branded<string, NonEmptyStringBrand>

export const isNonEmptyString = (v: string): v is NonEmptyStringBranded =>
  V.all_(v.length, V.minN(MIN))

/**
 * A string of Min 1 and Max 256KB characters
 */
export const NonEmptyString = extend(
  make((F) =>
    F.refined(F.string(), isNonEmptyString, {
      name: "NonEmptyString",
      conf: {
        [FastCheckURI]: (_c, fc) =>
          fc.module
            // let's be reasonable
            .string({ minLength: MIN }) // DONT DO THIS!!!!  maxLength: 256 * 1024
            .map((x) => x as NonEmptyStringBranded),
        [DecoderURI]: withMessage(() => "is not a NonEmpty String"),
      },
      extensions: {
        openapiMeta: {
          minLength: MIN,
        },
      },
    })
  )
)
export interface NonEmptyStringBrand {
  readonly NonEmptyString: unique symbol
}
export type NonEmptyString = AType<typeof NonEmptyString>

const REASONABLE_STRING_MAX = 256 - 1

export const isReasonableString = (
  v: string
): v is Branded<string, ReasonableStringBrand> & NonEmptyStringBranded =>
  V.all_(v.length, V.minN(MIN), V.maxN(REASONABLE_STRING_MAX))

export function makeReasonableString(
  arbF: (
    c: Arbitrary<Branded<string, ReasonableStringBrand>>,
    fc_: FC
  ) => Arbitrary<string>
) {
  return make((F) =>
    F.refined(F.string(), isReasonableString, {
      name: "ReasonableString",
      conf: {
        [FastCheckURI]: (c, fc) =>
          pipe(arbF(c, fc.module), (a) =>
            a.map(
              flow(
                (x) => x.substring(0, REASONABLE_STRING_MAX),
                (i) =>
                  i as Branded<string, ReasonableStringBrand> & NonEmptyStringBranded
              )
            )
          ),
        [DecoderURI]: withMessage(
          () => `is not a Reasonable String (${MIN}-${REASONABLE_STRING_MAX})`
        ),
      },
      extensions: {
        openapiMeta: {
          minLength: MIN,
          maxLength: REASONABLE_STRING_MAX,
        },
      },
    })
  )
}
/**
 * A string of Min 1 and Max 255 characters
 */
export const ReasonableString = make((F) =>
  F.refined(NonEmptyString(F), isReasonableString, {
    name: "ReasonableString",
    conf: {
      [FastCheckURI]: (_c, fc) =>
        fc.module
          .string({ minLength: MIN, maxLength: REASONABLE_STRING_MAX })
          .map(
            (x) => x as Branded<string, ReasonableStringBrand> & NonEmptyStringBranded
          ),
      [DecoderURI]: withMessage(
        () => `is not a Reasonable String (${MIN}-${REASONABLE_STRING_MAX})`
      ),
    },
    extensions: {
      openapiMeta: {
        minLength: MIN,
        maxLength: REASONABLE_STRING_MAX,
      },
    },
  })
)
export interface ReasonableStringBrand extends NonEmptyStringBrand {
  readonly ReasonableString: unique symbol
}
export type ReasonableString = AType<typeof ReasonableString>

const LONG_STRING_MAX = 2048 - 1
export const isLongString = (v: string): v is Branded<string, LongStringBrand> =>
  V.all_(v.length, V.minN(MIN), V.maxN(LONG_STRING_MAX))

export function makeLongString(
  arbF: (c: Arbitrary<Branded<string, LongStringBrand>>, fc_: FC) => Arbitrary<string>
) {
  return make((F) =>
    F.refined(F.string(), isLongString, {
      name: "LongString",
      conf: {
        [FastCheckURI]: (c, fc) =>
          pipe(arbF(c, fc.module), (a) =>
            a.map(
              flow(
                (x) => x.substring(0, LONG_STRING_MAX),
                castBrand<string, LongStringBrand>()
              )
            )
          ),
        [DecoderURI]: withMessage(
          () =>
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `is not a Long String (${MIN}-${LONG_STRING_MAX})`
        ),
      },
      extensions: {
        openapiMeta: {
          minLength: MIN,
          maxLength: LONG_STRING_MAX,
        },
      },
    })
  )
}

/**
 * A string of Min 1 and Max 2047 characters
 */
export const LongString = makeLongString((_c, fc) =>
  fc.string({ minLength: MIN, maxLength: LONG_STRING_MAX })
)
export interface LongStringBrand extends ReasonableStringBrand {
  readonly LongString: unique symbol
}
export type LongString = AType<typeof LongString>

const MAX_TEXT_STRING = 64 * 1024
export const isTextString = (v: string): v is Branded<string, TextStringBrand> =>
  V.all_(v.length, V.minN(MIN), V.maxN(MAX_TEXT_STRING))

export function makeTextString(
  arbF: (c: Arbitrary<Branded<string, TextStringBrand>>, fc_: FC) => Arbitrary<string>
) {
  return make((F) =>
    F.refined(F.string(), isTextString, {
      name: "TextString",
      conf: {
        [FastCheckURI]: (c, fc) =>
          pipe(arbF(c, fc.module), (a) =>
            a.map(
              flow(
                (x) => x.substring(0, MAX_TEXT_STRING),
                castBrand<string, TextStringBrand>()
              )
            )
          ),
        [DecoderURI]: withMessage(
          () =>
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `is not a Text String (${MIN}-${MAX_TEXT_STRING})`
        ),
      },
      extensions: {
        openapiMeta: {
          minLength: MIN,
          maxLength: MAX_TEXT_STRING,
        },
      },
    })
  )
}

/**
 * A string of Min 1 and Max 64kb characters
 */
export const TextString = makeTextString((_c, fc) =>
  fc.string({ minLength: MIN, maxLength: MAX_TEXT_STRING })
)
export interface TextStringBrand extends LongStringBrand {
  readonly TextString: unique symbol
}
export type TextString = AType<typeof TextString>

const MIN_STRING_ID = 6
const MAX_STRING_ID = 50
export const isStringId = (
  v: string
): v is Branded<string, StringIdBrand> & NonEmptyStringBranded =>
  V.all_(v.length, V.minN(MIN_STRING_ID), V.maxN(MAX_STRING_ID))

/**
 * A string of Min 6 and Max 50 characters
 */
export const StringId = make((F) =>
  F.refined(NonEmptyString(F), isStringId, {
    name: "StringId",
    conf: {
      [FastCheckURI]: (_c, fc) =>
        fc.module
          .string({ minLength: MIN_STRING_ID, maxLength: MAX_STRING_ID })
          .map((x) => x as Branded<string, StringIdBrand> & NonEmptyStringBranded),
      [DecoderURI]: withMessage(
        () =>
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `is not a StringID (${MIN_STRING_ID}-${MAX_STRING_ID})`
      ),
    },
    extensions: {
      openapiMeta: {
        minLength: MIN_STRING_ID,
        maxLength: MAX_STRING_ID,
      },
    },
  })
)
export type StringId = AType<typeof StringId>

export interface StringIdBrand extends NonEmptyStringBrand {
  readonly StringId: unique symbol
}

type PositiveIntBranded = Branded<number, PositiveIntBrand> & IntBrand & PositiveBrand
export const isPositiveInt = (v: number): v is PositiveIntBranded => V.minN(0)(v)

export function makePositiveInt(
  arbF: (c: Arbitrary<PositiveIntBranded>, fc_: FC) => Arbitrary<number>
) {
  return extend(
    make((F) =>
      F.refined(F.number(), isPositiveInt, {
        name: "PositiveInt",
        conf: {
          [FastCheckURI]: (c, fc) =>
            pipe(arbF(c, fc.module), (a) =>
              a.map((a) => (isPositiveInt(a) ? a : (0 as PositiveIntBranded)))
            ),
        },
        extensions: {
          openapiMeta: {
            minimum: 0,
          },
        },
      })
    )
  )
}

export const PositiveInt = makePositiveInt((_c, fc) => fc.nat())
export type PositiveInt = AType<typeof PositiveInt>
export interface PositiveIntBrand {
  readonly PositiveInt: unique symbol
}

const isPositiveNumber = (v: number): v is Branded<number, PositiveNumberBrand> =>
  V.minN(0)(v)

export const PositiveNumber = make((F) =>
  F.refined(F.number(), isPositiveNumber, {
    name: "PositiveNumber",
    conf: {
      [FastCheckURI]: (_c, fc) =>
        fc.module.float(0, 100).map(castBrand<number, PositiveNumberBrand>()),
    },
    extensions: {
      openapiMeta: {
        minimum: 0,
      },
    },
  })
)
export type PositiveNumber = AType<typeof PositiveNumber>
export interface PositiveNumberBrand {
  readonly PositiveNumber: unique symbol
}

const isPercent = (v: number): v is Branded<number, PercentBrand> =>
  V.all(V.minN(0), V.maxN(100))(v)

export const Percent = make((F) =>
  F.refined(F.number(), isPercent, {
    name: "Percent",
    conf: {
      [FastCheckURI]: (_c, fc) =>
        fc.module.float(0, 100).map(castBrand<number, PercentBrand>()),
    },
    extensions: {
      openapiMeta: {
        minimum: 0,
        maximum: 100,
      },
    },
  })
)
export type Percent = AType<typeof Percent>
export interface PercentBrand {
  readonly Percent: unique symbol
}

// TODO
export const TODO = make((F) => F.stringLiteral("TODO"))
export type TODO = AType<typeof TODO>
export const constTODO = "TODO" as TODO

export const NonEmptyTextString = makeTextString((_c, fc) =>
  fc.lorem({ maxCount: 15, mode: "sentences" })
)

export const NonEmptyShortString = makeLongString((_c, fc) => fc.lorem({ maxCount: 3 }))

export const Word = makeReasonableString((_c, fc) => fc.lorem({ maxCount: 1 }))

const defaultVoid = Sy.succeed(constVoid())
const defaultVoidThunk = () => defaultVoid
const Void_ = make((F) =>
  F.unknown({
    conf: {
      [DecoderURI]: (codec) => codec.with(defaultVoidThunk),
      [EncoderURI]: () => ({ encode: defaultVoidThunk }),
    },
  })
)
export type Void = void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Void = opaque<Void, Void>()(Void_ as any)
