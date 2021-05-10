/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Convert to @effect-ts/morphic

import type { Branded } from "@effect-ts/core/Branded"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import {
  AType,
  EType,
  DecoderURI,
  M,
  make,
  opaque as opaqueOriginal,
} from "@effect-ts/morphic"
import type { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import {
  Context,
  ContextEntry,
  decoder,
  Decoder,
  Errors,
  Validate,
  Validation,
} from "@effect-ts/morphic/Decoder"
import { encoder } from "@effect-ts/morphic/Encoder"
import * as EQ from "@effect-ts/morphic/Equal"
import * as FC from "@effect-ts/morphic/FastCheck"
import * as Guard from "@effect-ts/morphic/Guard"
import * as Show from "@effect-ts/morphic/Show"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"
import short from "short-uuid"
import { v4 } from "uuid"

import { pipe, flow } from "../Function"
import * as Ord from "../Order"
import * as T from "../Sync"
import * as u from "../utils"

import "@effect-ts/core/Operator"

// eslint-disable-next-line @typescript-eslint/ban-types
export const getFunctionName = (f: Function): string =>
  (f as any).displayName || (f as any).name || `<function${f.length}>`

export const deriveEq = EQ.equal
export const deriveFC = FC.arbitrary
export const deriveShow = Show.show
export const deriveGuard = Guard.guard

export declare type Exact<T, X extends T> = T &
  {
    [K in ({
      [K in keyof X]: K
    } &
      {
        [K in keyof T]: never
      } & {
        [key: string]: never
      })[keyof X]]?: never
  }

export const exact =
  <T>() =>
  <AA extends Exact<T, AA>>(a: AA) => {
    return a as T
  }

export const withNiceMessage =
  (message: (i: unknown) => string) =>
  <A>(codec: Decoder<A>) =>
    withNiceMessage_(codec, message)

// Fixes that when a message is specified in the parent
// we still try to show the child errors...
export function withNiceMessage_<A>(
  codec: Decoder<A>,
  message: (i: unknown) => string
) {
  const codecc = codec as any as { with(validate: Validate<A>): Decoder<A> }
  return codecc.with(function (i, c) {
    return pipe(
      codec.validate(i, c),
      T.mapError((errors) => {
        //console.log(JSON.stringify(errors, undefined, 2), c.length, errors[0].value, i)
        // When children have errors, report them
        // otherwise if parent has errors, report that
        // c.length === 1 &&
        if (errors[0].value != i) {
          return errors
        }
        return [
          {
            value: i,
            context: c,
            message: message(i),
          },
        ]
      })
    )
  })
}

export const withMessage =
  (message: (i: unknown) => string) =>
  <A>(codec: Decoder<A>) =>
    withMessage_(codec, message)

// Fixes that when a message is specified in the parent
// we still try to show the child errors...
export function withMessage_<A>(codec: Decoder<A>, message: (i: unknown) => string) {
  const codecc = codec as any as { with(validate: Validate<A>): Decoder<A> }
  return codecc.with(function (i, c) {
    return pipe(
      codec.validate(i, c),
      T.mapError((errors) => {
        //console.log(JSON.stringify(errors, undefined, 2), c.length, errors[0].value, i)
        // When children have errors, report them
        // otherwise if parent has errors, report that
        // c.length === 1 &&
        if (errors[0].value != i) {
          return errors
        }
        return [
          {
            value: i,
            context: c,
            message: message(i),
          },
        ]
      })
    )
  })
}

export function printErrors(errors: Errors) {
  return pipe(formatErrors(errors)).join("\n")
}

export function formatErrors(errors: Errors) {
  return pipe(decodeErrors(errors), A.map(formatError))
}

export function formatError({
  expectedType,
  message,
  path,
  provided,
  rootType,
}: ValidationErrorEntry) {
  return `${describeValue(provided.value)} ${message} at: ${rootType}.${
    path ? `[${path}]: ` : ""
  }${expectedType}`
}

export function decodeErrors(x: Errors) {
  return pipe(
    x,
    A.map(({ message, context: [root, ...rest], value }) => {
      const processCtx = (current: ContextEntry, path?: string, rootType?: string) => ({
        message: message ? message : getErrorMessage(current),
        expectedType: current.type.name,
        rootType,
        path,
        provided: {
          value,
          type: typeof value,
          constructor:
            value && typeof value === "object"
              ? ` ${value.constructor.name}`
              : undefined,
        },
      })
      return rest.length
        ? processCtx(
            rest[rest.length - 1],
            rest
              .map((x) => x.key)
              // the root object inside an array, then has no key again.
              .filter(u.isTruthy)
              .join("."),
            root.type.name
          )
        : processCtx(root)
    })
  )
}

function getErrorMessage(current: ContextEntry) {
  switch (current.type.name) {
    case "NonEmptyString":
      return "Must not be empty"
  }
  if (current.type.name?.startsWith("NonEmptyArray<")) {
    return "Must not be empty"
  }
  return `Invalid value specified`
}

export function stringify(v: unknown) {
  if (typeof v === "function") {
    return getFunctionName(v)
  }
  if (typeof v === "number" && !isFinite(v)) {
    if (isNaN(v)) {
      return "NaN"
    }
    return v > 0 ? "Infinity" : "-Infinity"
  }
  return JSON.stringify(v)
}

export function describeValue(v: unknown) {
  return `${stringify(v)} (${typeof v}${
    v && typeof v === "object" ? ` ${v.constructor.name}` : ""
  })`
}

export const toValidationError = flow(decodeErrors, (errors) =>
  ValidationError.build({
    _tag: "ValidationError",
    message: "One or more Validation errors ocurred",
    errors,
  })
)

export const makeStrict =
  <E, A>(dec: (i: unknown, mode?: Mode) => T.IO<E, A>) =>
  (i: unknown) =>
    dec(i, "strict")

export interface Interpreter<E, A> {
  meta: {
    name: string
  }
  build: (a: A) => A
  validate_: (i: unknown, context: Context, strict?: Mode) => T.IO<Errors, A>
  encode_: (a: A, strict?: Mode) => T.IO<never, E>
  decode_: (i: unknown, strict?: Mode) => T.IO<Errors, A>
  parse_: (i: E, strict?: Mode) => T.IO<Errors, A>

  validate: (strict: Mode) => (i: unknown, context: Context) => T.IO<Errors, A>
  encode: (strict: Mode) => (a: A) => T.IO<never, E>
  decode: (strict: Mode) => (i: unknown) => T.IO<Errors, A>
  parse: (strict: Mode) => (i: E) => T.IO<Errors, A>
}

export type HasDecoder<A, E = Errors> = {
  decode_: (i: unknown, strict?: Mode) => T.IO<E, A>
  decode: (strict: Mode) => (i: unknown) => T.IO<E, A>
}

export type HasEncoder<A, E> = {
  encode_: (i: A, strict?: Mode) => T.UIO<E>
  encode: (strict: Mode) => (i: A) => T.UIO<E>
}

export const ValidationErrorEntry = make((F) =>
  F.both(
    {
      message: F.string(),
      provided: F.both({ value: F.unknown() }, { constructor: F.string() }),
    },
    {
      expectedType: F.string(),
      path: F.string(),
      rootType: F.string(),
    }
  )
)
export type ValidationErrorEntry = AType<typeof ValidationErrorEntry>

const ValidationError_ = make((F) =>
  F.interface(
    {
      _tag: F.stringLiteral("ValidationError"),
      message: F.string(),
      errors: F.array(ValidationErrorEntry(F)),
    },
    { name: "ValidationError" }
  )
)
export interface ValidationError extends AType<typeof ValidationError_> {}
export interface ValidationErrorE extends EType<typeof ValidationError_> {}

export const ValidationError =
  opaque<ValidationErrorE, ValidationError>()(ValidationError_)

// const asInvalidContract = (context: unknown) => <A>(a: T.IO<ValidationError, A>) =>
//   pipe(
//     a,
//     T.mapError((error) =>
//       as.InvalidState({ message: "Invalid data", details: { context, error } })
//     )
//   )

// export const decodeResponse = <A>(
//   decoder: (i: unknown) => T.IO<ValidationError, A>
// ) => (context?: unknown) => (d: unknown) => pipe(decoder(d), asInvalidContract(context))

// export const decodeResponseorDie = <A>(
//   decoder: (i: unknown) => T.IO<ValidationError, A>
// ) => {
//   const decode = decodeResponse(decoder)
//   return (context: unknown) => flow(decode(context), T.orDie)
// }

type Mode = "classic" | "strict"

export function ext<E, A>(m: Interpreter<E, A>): Extensions<E, A> {
  const exactA = exact<A>()
  const exactE = exact<E>()

  // backwards compatibility
  const validateM_ = m.validate_
  const parseM_ = m.parse_
  const encodeM_ = m.encode_
  const decodeM_ = m.decode_

  const parseV_ = flow(m.parse_, T.mapError(toValidationError))
  const parseVM_ = parseV_

  const decodeV_ = flow(m.decode_, T.mapError(toValidationError))
  const decodeVM_ = decodeV_

  const validateM = (strict: Mode) => (i: unknown, context: Context) =>
    validateM_(i, context, strict)

  const parseM = m.parse
  const encodeM = m.encode
  const decodeM = m.decode

  const parseV = (mode: Mode = "classic") =>
    flow(m.parse(mode), T.mapError(toValidationError))
  const parseVM = parseV

  const decodeV = (mode: Mode = "classic") =>
    flow(m.decode(mode), T.mapError(toValidationError))
  const decodeVM = decodeV

  //   const decodeRM_ = (d: unknown, mode?: Mode, context?: unknown) =>
  //     decodeResponse(decodeVM(mode))(context)(d)
  //   const decodeRMorDie_ = (d: unknown, mode?: Mode, context?: unknown) =>
  //     decodeResponseorDie(decodeVM(mode))(context)(d)

  //   const decodeRM = (mode: Mode) => decodeResponse(decodeVM(mode))
  //   const decodeRMorDie = (mode: Mode) => decodeResponseorDie(decodeVM(mode))

  return {
    /**
     * Make sure there are no excess properties
     */
    exactA,

    /**
     * Make sure there are no excess properties
     */
    exactE,

    validateM,
    parseM,
    encodeM,
    decodeM,
    /**
     * Like decode, but maps error
     */
    decodeV,
    /**
     * Like decodeV, but as Effect
     */
    decodeVM,

    // /**
    //  * Like decodeVM, but maps to InvalidStateError
    //  */
    // decodeRM,

    // /**
    //  * Like decodeVM, but maps to InvalidStateError and Aborts
    //  */
    // decodeRMorDie,

    /**
     * Like parse, but maps error
     */
    parseV,
    /**
     * Like parseV, but as Effect
     */
    parseVM,

    validateM_,
    parseM_,
    encodeM_,
    decodeM_,
    /**
     * Like decode, but maps error
     */
    decodeV_,
    /**
     * Like decodeV, but as Effect
     */
    decodeVM_,

    // /**
    //  * Like decodeVM, but maps to InvalidStateError
    //  */
    // decodeRM_,

    // /**
    //  * Like decodeVM, but maps to InvalidStateError and Aborts
    //  */
    // decodeRMorDie_,

    /**
     * Like parse, but maps error
     */
    parseV_,
    /**
     * Like parseV, but as Effect
     */
    parseVM_,
  }
}
export interface Extensions<E, A> {
  /**
   * Make sure there are no excess properties
   */
  exactA: <AA extends Exact<A, AA>>(a: AA) => A
  /**
   * Make sure there are no excess properties
   */
  exactE: <EE extends Exact<E, EE>>(a: EE) => E

  /**
   * Like decode, but maps error
   */
  decodeV_: (i: unknown, strict?: Mode | undefined) => T.IO<ValidationError, A>
  /**
   * Like decodeV, but as Effect
   */
  decodeVM_: (i: unknown, strict?: Mode | undefined) => T.IO<ValidationError, A>
  //   /**
  //    * Like decodeVM, but maps to InvalidStateError
  //    */
  //   decodeRM_: (
  //     i: unknown,
  //     strict?: Mode | undefined,
  //     context?: unknown
  //   ) => T.IO<InvalidStateError, A>
  //   /**
  //    * Like decodeVM, but maps to InvalidStateError and Aborts
  //    */
  //   decodeRMorDie_: (i: unknown, strict?: Mode | undefined, context?: unknown) => T.UIO<A>
  /**
   * Like parse, but maps error
   */
  parseV_: (i: E, strict?: Mode | undefined) => T.IO<ValidationError, A>
  /**
   * Like parseV, but as Effect
   */
  parseVM_: (i: E, strict?: Mode | undefined) => T.IO<ValidationError, A>

  validateM_: (i: unknown, context: Context, strict?: Mode) => T.IO<Errors, A>
  encodeM_: (a: A, strict?: Mode) => T.UIO<E>
  decodeM_: (i: unknown, strict?: Mode) => T.IO<Errors, A>
  parseM_: (i: E, strict?: Mode) => T.IO<Errors, A>

  /**
   * Like decode, but maps error
   */
  decodeV: (strict: Mode) => (i: unknown) => T.IO<ValidationError, A>
  /**
   * Like decodeV, but as Effect
   */
  decodeVM: (strict: Mode) => (i: unknown) => T.IO<ValidationError, A>
  //   /**
  //    * Like decodeVM, but maps to InvalidStateError
  //    */
  //   decodeRM: (
  //     strict: Mode
  //   ) => (context?: unknown) => (i: unknown) => T.IO<InvalidStateError, A>
  //   /**
  //    * Like decodeVM, but maps to InvalidStateError and Aborts
  //    */
  //   decodeRMorDie: (strict: Mode) => (context?: unknown) => (i: unknown) => T.UIO<A>
  /**
   * Like parse, but maps error
   */
  parseV: (strict: Mode) => (i: E) => T.IO<ValidationError, A>
  /**
   * Like parseV, but as Effect
   */
  parseVM: (strict: Mode) => (i: E) => T.IO<ValidationError, A>

  validateM: (strict: Mode) => (a: A, context: Context) => T.IO<Errors, A>
  encodeM: (strict: Mode) => (a: A) => T.UIO<E>
  decodeM: (strict: Mode) => (i: unknown) => T.IO<Errors, A>
  parseM: (strict: Mode) => (i: E) => T.IO<Errors, A>
}

function extn<T, X>(a: T, ext: X) {
  Object.assign(a, ext)
  return a as T & X
}

type GetE<TM> = TM extends M<{}, infer E, any> ? E : never
type GetA<TM> = TM extends M<{}, any, infer A> ? A : never

export function extend<TM extends M<{}, any, any>>(m: TM) {
  type E = GetE<TM>
  type A = GetA<TM>
  const { decode: decodeClassic, name, validate: validateClassic } = decoder(m)
  const { encode: encodeClassic } = encoder(m)

  const str = strict(m)
  const { decode: decodeStrict, validate: validateStrict } = strictDecoder(m)

  const encodeStrict = (a: A) => pipe(str.shrink(a), T.chain(encodeClassic))

  const decode_ = (e: unknown, mode: Mode = "classic") =>
    mode === "classic" ? decodeClassic(e) : decodeStrict(e)

  const build = (a: A) => a

  const parse_: (e: E, mode?: Mode) => Validation<A> = decode_

  const encode_ = (a: A, mode: Mode = "classic") =>
    mode === "classic" ? encodeClassic(a) : encodeStrict(a)

  const validate_ = (e: unknown, context: Context, mode: Mode = "classic") =>
    mode === "classic" ? validateClassic(e, context) : validateStrict(e, context)

  const validate = (mode: Mode) => (e: unknown, context: Context) =>
    validate_(e, context, mode)

  const decode = (mode: Mode) => (i: unknown) => decode_(i, mode)
  const parse = (mode: Mode) => (e: E) => parse_(e, mode)
  const encode = (mode: Mode) => (a: A) => encode_(a, mode)

  if (!name) {
    throw new Error("you should really set a name!")
  }

  const interpreter: Interpreter<E, A> = {
    meta: { name },
    build,

    validate_,
    decode_,
    parse_,
    encode_,

    validate,
    decode,
    parse,
    encode,
  }
  const mn = extn(m, interpreter)
  return extn(mn, ext(mn))
}

export function opaque<E, A>() {
  return (m: M<{}, E, A>) => {
    const op = opaqueOriginal<E, A>()(m)
    return extend(op)
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function opaqueA<A>() {
  return <E>(m: M<{}, E, A>) => opaque<E, A>()(m)
}

export function castBrand<T, B>() {
  return (i: T) => i as Branded<T, B>
}

export function createUnorder<T>(): Ord.Ord<T> {
  return {
    compare: (_a: T, _b: T) => 0,
  }
}

export const StringSameORD = createUnorder<string>()

export const generateUuidV4: T.UIO<UUID> = T.succeedWith(() => v4() as UUID)

const translator = short()
type ShortId = string
export const generateShortId: T.UIO<ShortId> = T.succeedWith(translator.generate)

// TODO: new service for sync+async
export const getCurrentDate = T.succeedWith(() => new Date())

export const create = T.struct({ createdAt: getCurrentDate, id: generateUuidV4 })
export function createWith<T>(computeState: (cd: Date, id: UUID) => T) {
  return pipe(
    create,
    T.map(({ createdAt, id }) => computeState(createdAt, id))
  )
}

export const createShort = T.struct({
  createdAt: getCurrentDate,
  id: generateShortId,
})
export function createWithShort<T>(computeState: (cd: Date, id: ShortId) => T) {
  return pipe(
    createShort,
    T.map(({ createdAt, id }) => computeState(createdAt, id))
  )
}

type GetErrorTag<T> = T extends { _errorTag: infer K } ? K : never
export const isOfErrorType =
  <T extends { _errorTag: string }>(tag: GetErrorTag<T>) =>
  (e: { _errorTag: string }): e is T =>
    e._errorTag === tag

type GetTag<T> = T extends { _tag: infer K } ? K : never
export const isOfType =
  <T extends { _tag: string }>(tag: GetTag<T>) =>
  (e: { _tag: string }): e is T =>
    e._tag === tag

export function withEmptyStringAsNullable<A extends string>(
  codec: Decoder<O.Option<A>>
) {
  return codec.with((u, c) => codec.validate(u === "" ? null : u, c))
}

export function makeNullableStringWithFallback<E extends string, A extends string>(
  t: M<{}, E, A>
) {
  return make((F) =>
    F.nullable(t(F), {
      conf: {
        [DecoderURI]: withEmptyStringAsNullable,
      },
    })
  )
}

export function makeKeys<T extends string>(a: readonly T[]) {
  return a.reduce((prev, cur) => {
    prev[cur] = null
    return prev
  }, {} as { [P in typeof a[number]]: null })
}

export type { Errors }
export * from "@effect-ts/morphic"
