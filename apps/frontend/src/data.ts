import { Cause } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"
import { pipe } from "@effect-ts/core/Function"
import { useState, useCallback } from "react"

class UnknownError {
  public readonly _trag = "UnknownError"
  constructor(public readonly error: unknown) {}
}

/**
 * Poor mans "RemoteData"
 */
export function useFetch<R, E, A, Args extends readonly unknown[], B>(
  fetchFnc: (...args: Args) => T.Effect<R, E, A>,
  defaultData: B
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<E | UnknownError | null>(null)
  const [data, setData] = useState<A | B>(defaultData)
  const exec = useCallback(
    function (...args: Args) {
      return pipe(
        T.effectTotal(() => setLoading(true)),
        T.zipRight(fetchFnc(...args)),
        T.tap((r) => T.effectTotal(() => setData(r))),
        T.tap(() => T.effectTotal(() => setLoading(false))),
        T.result,
        T.chain(
          Ex.foldM((cause) => {
            if (Cause.died(cause)) {
              const [abortedWith] = Cause.defects(cause)
              const err = new UnknownError(abortedWith)
              setError(err)
            }
            if (Cause.failed(cause)) {
              const [err] = Cause.failures(cause)
              setError(err)
            }
            setLoading(false)
            return T.halt(cause)
          }, T.succeed)
        )
      )
    },
    [fetchFnc]
  )
  return [{ loading, data, error }, exec] as const
}
