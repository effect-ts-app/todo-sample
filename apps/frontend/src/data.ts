import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import { useState, useCallback } from "react"

import { ProvidedEnv, useRun } from "./run"

/**
 * Poor mans "RemoteData"
 */
export function useFetch<E, A, Args extends readonly unknown[], B>(
  fetchFnc: (...args: Args) => T.Effect<ProvidedEnv, E, A>,
  defaultData: B
) {
  const runEffect = useRun()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown | null>(null)
  const [data, setData] = useState<A | B>(defaultData)
  const exec = useCallback(
    async function (...args: Args) {
      setLoading(true)
      try {
        return await pipe(fetchFnc(...args), T.map(setData), runEffect)
      } catch (err) {
        console.error(err)
        setError(err)
      } finally {
        setLoading(false)
      }
    },
    [fetchFnc]
  )
  return [{ loading, data, error }, exec] as const
}
