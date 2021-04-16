import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { effectAsyncInterrupt } from "@effect-ts/core/Effect"
import { Lazy } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"

export function fromPromiseWithInterrupt<E, A>(
  promise: Lazy<Promise<A>>,
  onReject: (reason: unknown) => E,
  canceller: () => void,
  __trace?: string
): T.IO<E, A> {
  return effectAsyncInterrupt((resolve) => {
    promise()
      .then((x) => pipe(x, T.succeed, resolve))
      .catch((x) => pipe(x, onReject, T.fail, resolve))
    return T.succeedWith(canceller)
  }, __trace)
}

export function encaseOption_<E, A>(o: O.Option<A>, onError: Lazy<E>): T.IO<E, A> {
  return O.fold_(o, () => fail(onError()), T.succeed)
}

export function encaseOption<E>(onError: Lazy<E>) {
  return <A>(o: O.Option<A>) => encaseOption_<E, A>(o, onError)
}

export * from "@effect-ts/core/Effect"
