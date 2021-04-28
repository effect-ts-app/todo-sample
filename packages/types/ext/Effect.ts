import { pipe } from "@effect-ts/core"
import {
  IO,
  succeed,
  succeedWith,
  fail,
  effectAsyncInterrupt,
} from "@effect-ts/core/Effect"
import { Lazy } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"

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

export * from "@effect-ts/core/Effect"
