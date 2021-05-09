import * as AR from "@effect-ts/core/Collections/Immutable/Array"
import * as Eq from "@effect-ts/core/Equal"
import { make, M } from "@effect-ts/morphic"
import { SetConfig } from "@effect-ts/morphic/Algebra/Set"
import { Context, Decoder, fail, Errors } from "@effect-ts/morphic/Decoder"
import { ConfigsForType, Named } from "@effect-ts/morphic/HKT"

import { pipe } from "../Function"
import * as Ord from "../Order"
import * as SET from "../Set"
import * as T from "../Sync"

import "@effect-ts/core/Operator"
import { interpretArray } from "./array"
import { createUnorder } from "./model"

export const withNonEmptySet = <A>(codec: Decoder<SET.Set<A>>) =>
  codec.with((u, c) =>
    pipe(
      codec.validate(u, c),
      T.chain((set) => (set.size > 0 ? T.succeed(set) : fail(u, c, "Cannot be Empty")))
    )
  )

export function makeSet<E, A>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: M<{}, E, A>,
  ord: Ord.Ord<A>,
  eq_?: Eq.Equal<A>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  cfg?: Named<ConfigsForType<{}, AR.Array<E>, SET.Set<A>, SetConfig<E, A>>>
) {
  const eq = eq_ ?? Ord.getEqual(ord)
  const morph = make((F) => F.set(type(F), ord, eq, cfg))
  return Object.assign(morph, SET.make(ord, eq))
}

export function makeUnorderedContramappedStringSet<E, A, MA extends string>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: M<{}, E, A>,
  contramap: (a: A) => MA,
  // eslint-disable-next-line @typescript-eslint/ban-types
  cfg?: Named<ConfigsForType<{}, AR.Array<E>, SET.Set<A>, SetConfig<E, A>>>
) {
  return makeUnorderedSet(type, Eq.contramap(contramap)(Eq.string), cfg)
}

export function makeUnorderedStringSet<E, A extends string>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: M<{}, E, A>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  cfg?: Named<ConfigsForType<{}, AR.Array<E>, SET.Set<A>, SetConfig<E, A>>>
) {
  return makeUnorderedSet(type, Eq.string, cfg)
}

export function makeUnorderedSet<E, A>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: M<{}, E, A>,
  eq: Eq.Equal<A>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  cfg?: Named<ConfigsForType<{}, AR.Array<E>, SET.Set<A>, SetConfig<E, A>>>
) {
  return makeSet(type, createUnorder<A>(), eq, cfg)
}

export function makeContramappedSet<E, A, MA>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: M<{}, E, A>,
  contramap: (a: A) => MA,
  ord: Ord.Ord<MA>,
  eq: Eq.Equal<MA>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  cfg?: Named<ConfigsForType<{}, AR.Array<E>, SET.Set<A>, SetConfig<E, A>>>
) {
  return makeSet(type, Ord.contramap_(ord, contramap), Eq.contramap(contramap)(eq), cfg)
}

export function interpretSet<E, A>(
  toArray: (set: SET.Set<E>) => readonly E[],
  decode: (i: unknown) => T.IO<any, A>
) {
  return (set: SET.Set<E>) => set["|>"](toArray)["|>"](interpretArrayAsSet(decode))
}

export function interpretArrayAsSet<A>(decode: (i: unknown) => T.IO<any, A>) {
  return <E>(ar: AR.Array<E>) =>
    ar["|>"](interpretArray(decode))["|>"]((ar) => new Set(ar))
}

export function withSetPreInterpreter<E, A>(
  validate: (i: unknown, context: Context) => T.IO<Errors, AR.Array<E>>,
  decode: (i: unknown) => T.IO<any, A>
) {
  return (codec: Decoder<SET.Set<A>>) =>
    codec.with((u, c) =>
      pipe(
        validate(u, c),
        T.map(interpretArray(decode)),
        T.chain((u) => codec.validate(u, c))
      )
    )
}
