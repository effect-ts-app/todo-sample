/* eslint-disable @typescript-eslint/no-explicit-any */
import * as D from "@effect-ts/core/Collections/Immutable/Dictionary"
import { Dictionary } from "@effect-ts/core/Collections/Immutable/Dictionary"
import * as E from "@effect-ts/core/Either"
import * as Sy from "@effect-ts/core/Sync"

import { flow, identity, pipe } from "../Function"
import * as O from "../Option"

export * from "./extend"

export const unsafe = flow(
  Sy.runEither,
  E.fold(() => {
    throw new Error("Invalid data")
  }, identity)
)

export const unsafeRight = <E, A>(ei: E.Either<E, A>) => {
  if (E.isLeft(ei)) {
    console.error(ei.left)
    throw ei.left
  }
  return ei.right
}

export const unsafeSome = (makeErrorMessage: () => string) => <A>(o: O.Option<A>) => {
  if (O.isNone(o)) {
    throw new Error(makeErrorMessage())
  }
  return o.value
}

export function toString(v: unknown) {
  return `${v}`
}

export const isTruthy = <T>(item: T | null): item is T => Boolean(item)
export const typedKeysOf = <T>(obj: T) => Object.keys(obj) as (keyof T)[]
export const typedValuesOf = <T>(obj: T) => Object.values(obj) as ValueOf<T>[]
type ValueOf<T> = T[keyof T]

export type Constructor<T = any> = { new (...args: any[]): T }
export type ThenArg<T> = T extends Promise<infer U>
  ? U
  : T extends (...args: any[]) => Promise<infer V>
  ? V
  : T

export function dropUndefined<A>(input: Dictionary<A | undefined>): Dictionary<A> {
  const newR = pipe(
    input,
    D.filter((x): x is A => x !== undefined)
  )
  return newR
}

type GetTag<T> = T extends { _tag: infer K } ? K : never
export const isOfType = <T extends { _tag: string }>(tag: GetTag<T>) => (e: {
  _tag: string
}): e is T => e._tag === tag
