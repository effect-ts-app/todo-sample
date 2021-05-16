/* eslint-disable @typescript-eslint/no-explicit-any */
import * as O from "@effect-ts-demo/core/ext/Option"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { v4 } from "uuid"

import { Compute } from "../Compute"
import { constant, Lazy, pipe } from "../Function"
import { typedKeysOf } from "../utils"

import * as S from "./_schema"
import { schemaField, UUID } from "./_schema"

export function partialConstructor<ConstructorInput, ParsedShape>(model: {
  new (inp: ConstructorInput): ParsedShape
}): <PartialConstructorInput extends Partial<ConstructorInput>>(
  // TODO: Prevent over provide
  partConstructor: PartialConstructorInput
) => (
  restConstructor: Compute<Omit<ConstructorInput, keyof PartialConstructorInput>>
) => ParsedShape {
  return (partConstructor) => (restConstructor) =>
    partialConstructor_(model, partConstructor)(restConstructor)
}

export function partialConstructor_<
  ConstructorInput,
  ParsedShape,
  PartialConstructorInput extends Partial<ConstructorInput>
>(
  model: {
    new (inp: ConstructorInput): ParsedShape
  },
  // TODO: Prevent over provide
  partConstructor: PartialConstructorInput
): (
  restConstructor: Compute<Omit<ConstructorInput, keyof PartialConstructorInput>>
) => ParsedShape {
  return (restConstructor) =>
    new model({ ...partConstructor, ...restConstructor } as any)
}

// TODO: morph the schema instead.
export function derivePartialConstructor<ConstructorInput, ParsedShape>(model: {
  [S.schemaField]: S.Schema<any, any, ParsedShape, ConstructorInput, any, any, any>
  new (inp: ConstructorInput): ParsedShape
}): <PartialConstructorInput extends Partial<ConstructorInput>>(
  // TODO: Prevent over provide
  partConstructor: PartialConstructorInput
) => (
  restConstructor: Compute<Omit<ConstructorInput, keyof PartialConstructorInput>>
) => ParsedShape {
  return (partConstructor) => (restConstructor) =>
    derivePartialConstructor_(model, partConstructor)(restConstructor)
}

export function derivePartialConstructor_<
  ConstructorInput,
  ParsedShape,
  PartialConstructorInput extends Partial<ConstructorInput>
>(
  model: {
    [S.schemaField]: S.Schema<any, any, ParsedShape, ConstructorInput, any, any, any>
    new (inp: ConstructorInput): ParsedShape
  },
  // TODO: Prevent over provide
  partConstructor: PartialConstructorInput
): (
  restConstructor: Compute<Omit<ConstructorInput, keyof PartialConstructorInput>>
) => ParsedShape {
  return (restConstructor) =>
    new model({ ...partConstructor, ...restConstructor } as any)
}

export type GetPartialConstructor<A extends (...args: any) => any> = Parameters<
  ReturnType<A>
>[0]

export function makeUuid() {
  return v4() as S.UUID
}

/**
 * Automatically assign the name of the Class to the Schema.
 */
export const namedC = function (cls: any) {
  cls[schemaField] = cls[schemaField]["|>"](S.named(cls.name))
  return cls
}

type LazyPartial<T> = {
  [P in keyof T]?: Lazy<T[P]>
}

export function withDefaultConstructorFields<
  ParserInput,
  ParserError extends S.AnyError,
  ParsedShape,
  ConstructorInput,
  ConstructorError extends S.AnyError,
  Encoded,
  Api
>(
  self: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >
) {
  // TODO: but allow NO OTHERS!
  return <Changes extends LazyPartial<ConstructorInput>>(
    kvs: Changes
  ): S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    Omit<ConstructorInput, keyof Changes> &
      // @ts-expect-error we know keyof Changes matches
      Partial<Pick<ConstructorInput, keyof Changes>>,
    ConstructorError,
    Encoded,
    Api
  > => {
    const constructSelf = S.Constructor.for(self)
    return pipe(
      self,
      S.constructor((u: any) =>
        constructSelf({
          ...u,
          ...Object.keys(kvs).reduce((prev, cur) => {
            if (typeof u[cur] === "undefined") {
              // @ts-expect-error we know we may run and assign
              prev[cur] = kvs[cur]()
            }
            return prev
          }, {} as any),
        } as any)
      )
    )
  }
}

export function makeCurrentDate() {
  return new Date()
}
export function defaultConstructor<
  Self extends S.SchemaUPI,
  As extends O.Option<PropertyKey>,
  Def extends O.Option<["parser" | "constructor" | "both", () => S.ParsedShapeOf<Self>]>
>(p: S.Property<Self, "required", As, Def>) {
  return (makeDefault: () => S.ParsedShapeOf<Self>) => p.def(makeDefault, "constructor")
}

type SupportedDefaults = A.Array<any> | O.Some<any> | O.None | Date | boolean | UUID
export function withDefault<
  ParsedShape extends SupportedDefaults,
  As extends O.Option<PropertyKey>,
  Def extends O.Option<
    [
      "parser" | "constructor" | "both",
      () => S.ParsedShapeOf<
        S.Schema<unknown, S.AnyError, ParsedShape, any, S.AnyError, any, any>
      >
    ]
  >
>(
  p: S.Property<
    S.Schema<unknown, S.AnyError, ParsedShape, any, S.AnyError, any, any>,
    "required",
    As,
    Def
  >
): S.Property<
  S.Schema<unknown, S.AnyError, ParsedShape, any, S.AnyError, any, any>,
  "required",
  As,
  O.Some<["constructor", () => ParsedShape]>
> {
  if (S.isAnnotated(p._schema, S.dateIdentifier)) {
    return p.def(makeCurrentDate as any, "constructor")
  }
  if (S.isAnnotated(p._schema, S.nullableIdentifier)) {
    return p.def(() => O.none as any, "constructor")
  }
  if (S.isAnnotated(p._schema, S.arrayIdentifier)) {
    return p.def(() => [] as any, "constructor")
  }
  if (S.isAnnotated(p._schema, S.boolIdentifier)) {
    return p.def(() => false as any, "constructor")
  }
  if (S.isAnnotated(p._schema, S.UUIDIdentifier)) {
    return p.def(makeUuid as any, "constructor")
  }
  throw new Error("Not supported")
}

function defProp<Self extends S.SchemaUPI>(
  schema: Self,
  makeDefault: () => S.ParsedShapeOf<Self>
) {
  return S.prop(schema).def(makeDefault, "constructor")
}

export function defaultProp<ParsedShape>(
  schema: S.Schema<unknown, S.AnyError, ParsedShape, any, S.AnyError, any, any>,
  makeDefault: () => ParsedShape
): S.Property<
  S.Schema<unknown, S.AnyError, ParsedShape, any, S.AnyError, any, any>,
  "required",
  O.None,
  O.Some<["constructor", () => ParsedShape]>
>
export function defaultProp<ParsedShape extends SupportedDefaults>(
  schema: S.Schema<unknown, S.AnyError, ParsedShape, any, S.AnyError, any, any>
): S.Property<
  S.Schema<unknown, S.AnyError, ParsedShape, any, S.AnyError, any, any>,
  "required",
  O.None,
  O.Some<["constructor", () => ParsedShape]>
>
export function defaultProp(
  schema: S.Schema<unknown, S.AnyError, any, any, S.AnyError, any, any>,
  makeDefault?: () => any
) {
  return makeDefault ? defProp(schema, makeDefault) : S.prop(schema)["|>"](withDefault)
}

export function include<Props extends Record<string, S.AnyProperty>>(props: Props) {
  return <NewProps extends Record<string, S.AnyProperty>>(
    fnc: (props: Props) => NewProps
  ) => include_(props, fnc)
}

export function include_<
  Props extends Record<string, S.AnyProperty>,
  NewProps extends Record<string, S.AnyProperty>
>(props: Props, fnc: (props: Props) => NewProps) {
  return fnc(props)
}

export function makeOptional<NER extends Record<string, S.AnyProperty>>(
  t: NER // TODO: enforce non empty
): {
  [K in keyof NER]: S.Property<
    NER[K]["_schema"],
    "optional",
    NER[K]["_as"],
    NER[K]["_def"]
  >
} {
  return typedKeysOf(t).reduce((prev, cur) => {
    prev[cur] = t[cur].opt()
    return prev
  }, {} as any)
}

export const constArray = constant(A.empty)

export * from "./_api"
// customized Model
export { Model } from "./Model"
export * from "./Model"

export * from "./vendor"
