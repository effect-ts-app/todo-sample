import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { Cause, Fiber, Semaphore } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"
import { pipe } from "@effect-ts/core/Function"
import { useState, useCallback, useEffect } from "react"

import { Fetcher, useFetchContext } from "./context"

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

export function useLimitToOne<R, E, A, Args extends readonly unknown[]>(
  exec: (...args: Args) => T.Effect<R, E, A>
) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [cancel, setCancel] = useState<() => {}>(() => () => void 0)
  return useCallback(
    (...args: Args) =>
      limitToOne(cancel, (cncl) => setCancel(() => cncl))(exec(...args)),
    [exec]
  )
}

function limitToOne(cancel: () => void, setCancel: (cnl: () => void) => void) {
  return <R, E, A>(self: T.Effect<R, E, A>) =>
    pipe(
      T.effectTotal(() => {
        console.log("cancel", cancel)
        cancel()
      }),
      T.zipRight(
        pipe(
          self,
          T.fork,
          // NOTE; actually the cancellation means that running to Promise will also not resolve on the success channel.
          // thus additional callbacks will fail.
          T.tap((f) => T.effectTotal(() => setCancel(() => T.run(Fiber.interrupt(f)))))
        )
      ),
      T.chain(Fiber.join)
    )
}

/**
 *
 * Able to use the query over and over in multiple components, but still sharing the same state.
 * TODO: should only share the result when variables are the same...
 */
export function useQuery<R, E, A, B, Args extends ReadonlyArray<unknown>>(
  name: string,
  fetchFunction: (...args: Args) => T.Effect<R, E, A>,
  defaultValue: B
) {
  const ctx = useFetchContext()
  type FetchFnc = typeof fetchFunction
  type F = Fetcher<E, E | UnknownError, A, B, FetchFnc>

  if (ctx.fetchers[name]) {
    if (fetchFunction !== ctx.fetchers[name].fetch) {
      throw new Error("fetch function is not stable")
    }
  } else {
    const fetcher: F = {
      cancel: () => void 0,
      fiber: null,
      fetch: fetchFunction,
      result: { data: defaultValue, error: null, loading: false },
      listeners: [],
      sync: Semaphore.unsafeMakeSemaphore(1),
    }
    ctx.fetchers[name] = fetcher
  }

  const getFetcher = () => ctx.fetchers[name] as F

  // todo; just store inside the context
  const ff = useCallback(
    function (...args: Args) {
      return pipe(
        T.effectTotal(() => {
          const f = getFetcher()
          f.result.loading = true
          f.listeners.forEach((x) => x(f.result))
        }),
        T.zipRight(fetchFunction(...args)),
        T.result,
        T.chain(
          Ex.foldM(
            (cause) => {
              console.warn("exiting on cause", cause)
              const f = getFetcher()
              if (Cause.died(cause)) {
                const [abortedWith] = Cause.defects(cause)
                const err = new UnknownError(abortedWith)
                f.result.error = err
              }
              if (Cause.failed(cause)) {
                const [err] = Cause.failures(cause)
                f.result.error = err
              }
              f.result.loading = false
              f.listeners.forEach((x) => x(f.result))
              f.fiber = null
              return T.halt(cause)
            },
            (r) =>
              T.effectTotal(() => {
                const f = getFetcher()
                f.result.loading = false
                f.result.data = r
                console.log(f.result, f.listeners)
                f.listeners.forEach((x) => x({ ...f.result }))
                f.fiber = null
                return r
              })
          )
        )
      )
    },
    [fetchFunction]
  )

  // joins existing fiber when available
  const exec = useCallback(
    function (...args: Args) {
      return pipe(
        T.effectTotal(() => getFetcher().fiber),
        T.chain((f) =>
          f
            ? T.effectTotal(() => {
                console.log("Joining existing fiber", f.id)
                return f
              })
            : pipe(
                ff(...args),
                T.fork,
                T.tap((f) =>
                  T.effectTotal(() => {
                    console.log("setting fiber", f.id)
                    getFetcher().fiber = f
                  })
                )
              )
        ),

        Semaphore.withPermit(getFetcher().sync),
        T.chain(Fiber.join)
      )
    },
    [ff]
  )

  // kills existing fiber when available and refetches
  const refetch = useCallback(
    (...args: Args) =>
      pipe(
        ff(...args),
        T.fork,
        T.tap((f) => {
          const runFib = getFetcher().fiber
          if (runFib) {
            console.log("interrupting fiber", runFib.id)
          }
          const setFiber = T.effectTotal(() => {
            console.log("setting fiber", f.id)
            getFetcher().fiber = f
          })
          return runFib
            ? Fiber.interrupt(runFib)["|>"](T.chain(() => setFiber))
            : setFiber
        }),
        Semaphore.withPermit(getFetcher().sync),
        T.chain(Fiber.join)
      ),
    [ff]
  )

  const [result, setResult] = useState<F["result"]>(getFetcher().result)
  useEffect(() => {
    const fetcher = getFetcher()
    setResult(fetcher.result)
    const handler = (result: F["result"]) => setResult(result)
    fetcher.listeners = A.snoc_(fetcher.listeners, handler)
    return () => {
      const fetcher = getFetcher()
      fetcher.listeners = A.deleteOrOriginal_(fetcher.listeners, handler)
      if (fetcher.listeners.length === 0) {
        delete ctx.fetchers[name]
      }
    }
  }, [])

  return [result, refetch, exec] as const
}
