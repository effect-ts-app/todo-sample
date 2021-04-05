import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { effectAsyncInterrupt } from "@effect-ts/core/Effect"
import { Lazy } from "@effect-ts/core/Function"

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
    return T.effectTotal(canceller)
  }, __trace)
}

export * from "@effect-ts/core/Effect"
