// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  chain,
  Effect,
  effectAsyncInterrupt,
  fail,
  fromEither,
  IO,
  succeed,
  succeedWith,
  tap,
} from "@effect-ts/core/Effect"
import type * as Ei from "@effect-ts/core/Either"
import * as O from "@effect-ts/core/Option"

import { flow, Lazy, pipe } from "./Function"

export const encaseEither = <E, A>(ei: Ei.Either<E, A>) => fromEither(() => ei)
export const chainEither = <E, A, A2>(ei: (a: A2) => Ei.Either<E, A>) =>
  chain((a: A2) => fromEither(() => ei(a)))

export type Erase<R, K> = R & K extends K & infer R1 ? R1 : R

export function tryCatchPromiseWithInterrupt<E, A>(
  promise: Lazy<Promise<A>>,
  onReject: (reason: unknown) => E,
  canceller: () => void,
  __trace?: string
): IO<E, A> {
  return effectAsyncInterrupt((resolve) => {
    promise()
      .then((x) => pipe(x, succeed, resolve))
      .catch((x) => pipe(x, onReject, fail, resolve))
    return succeedWith(canceller)
  }, __trace)
}

export function encaseOption_<E, A>(o: O.Option<A>, onError: Lazy<E>): IO<E, A> {
  return O.fold_(o, () => fail(onError()), succeed)
}

export function encaseOption<E>(onError: Lazy<E>) {
  return <A>(o: O.Option<A>) => encaseOption_<E, A>(o, onError)
}

export function liftM<A, B>(a: (a: A) => B) {
  return flow(a, succeed)
}

export function tupleCurriedTap<A, B, R, E, C>(f: (b: B) => (a: A) => Effect<R, E, C>) {
  return (t: readonly [A, B]) => succeed(t[0])["|>"](tap(f(t[1])))
}

export * from "@effect-ts/core/Effect"
