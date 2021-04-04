import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"
import { pipe } from "@effect-ts/core/Function"
import { useState, useCallback } from "react"

import { ProvidedEnv } from "./run"

/**
 * Poor mans "RemoteData"
 */
export function useFetch<E, A, Args extends readonly unknown[], B>(
  fetchFnc: (...args: Args) => T.Effect<ProvidedEnv, E, A>,
  defaultData: B
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown | null>(null)
  const [data, setData] = useState<A | B>(defaultData)
  const exec = useCallback(
    function (...args: Args) {
      return pipe(
        T.effectTotal(() => setLoading(true)),
        T.zipRight(fetchFnc(...args)),
        T.map(setData),
        T.result,
        T.map(
          Ex.fold(
            (f) => {
              console.error(f)
              setError(f)
              setLoading(false)
            },
            () => setLoading(false)
          )
        )
      )
    },
    [fetchFnc]
  )
  return [{ loading, data, error }, exec] as const
}
