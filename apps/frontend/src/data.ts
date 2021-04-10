import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { Fiber, Semaphore } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { Cause } from "@effect-ts/core/Effect/Cause"
import * as Ex from "@effect-ts/core/Effect/Exit"
import { Exit } from "@effect-ts/core/Effect/Exit"
import { pipe } from "@effect-ts/core/Function"
import { datumEither } from "@nll/datum"
import { DatumEither } from "@nll/datum/DatumEither"
import { useState, useCallback, useEffect } from "react"

import { Fetcher, useFetchContext } from "./context"

// class UnknownError {
//   public readonly _trag = "UnknownError"
//   constructor(public readonly error: unknown) {}
// }

export function useFetch<R, E, A, Args extends readonly unknown[]>(
  fetchFnc: (...args: Args) => T.Effect<R, E, A>
) {
  const [result, setResult] = useState<DatumEither<E, A>>(datumEither.constInitial())
  const exec = useCallback(
    function (...args: Args) {
      return pipe(
        // for mutations, we don't care about a refreshing state.
        T.effectTotal(() => setResult(datumEither.constPending())),
        T.zipRight(fetchFnc(...args)),
        T.tap((a) =>
          T.effectTotal(() => {
            setResult(datumEither.success(a))
          })
        ),
        T.catchAll((err) => {
          setResult(datumEither.failure(err))
          return T.fail(err)
        })
      )
    },
    [fetchFnc]
  )
  return [result, exec] as const
}

export function useLimitToOne<R, E, A, Args extends readonly unknown[]>(
  exec: (...args: Args) => T.Effect<R, E, A>
) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [cancel, setCancel] = useState<() => {}>(() => () => void 0)
  return useCallback(
    (...args: Args) =>
      limitToOne(cancel, (cncl) => setCancel(() => cncl))(exec(...args)),
    [cancel, exec]
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

export function useModify<A>(name: string) {
  const ctx = useFetchContext()
  const modify = useCallback(
    (mod: (a: A) => A) => {
      const f = ctx.fetchers[name] as {
        result: DatumEither<unknown, A>
        latestSuccess: DatumEither<unknown, A>
        update: (
          result: DatumEither<unknown, A>,
          latestSuccess: DatumEither<unknown, A>
        ) => void
      }
      const result = f.result["|>"](datumEither.map(mod))
      const latestSuccess = f.latestSuccess["|>"](datumEither.map(mod))
      f.update(result, latestSuccess)
    },
    [ctx.fetchers, name]
  )

  return modify
}

/**
 *
 * Able to use the query over and over in multiple components, but still sharing the same state.
 * TODO: should only share the result when variables are the same...
 * TODO: use ref.
 */
export function useQuery<R, E, A, Args extends ReadonlyArray<unknown>>(
  name: string,
  fetchFunction: (...args: Args) => T.Effect<R, E, A>
) {
  const ctx = useFetchContext()
  //const { runWithErrorLog } = useServiceContext()
  type FetchFnc = typeof fetchFunction
  type F = Fetcher<E, E, A, FetchFnc>

  if (ctx.fetchers[name]) {
    if (fetchFunction !== ctx.fetchers[name].fetch) {
      throw new Error("fetch function is not stable")
    }
  } else {
    const fetcher: F = {
      cancel: () => void 0,
      fiber: null,
      fetch: fetchFunction,
      result: datumEither.constInitial(),
      latestSuccess: datumEither.constInitial(),
      listeners: [],
      modify: (mod) => fetcher.update(mod(fetcher.result)),
      update: (result, latestSuccess) => {
        fetcher.result = result
        if (latestSuccess) {
          fetcher.latestSuccess = latestSuccess
        } else {
          latestSuccess = fetcher.latestSuccess = datumEither.isSuccess(result)
            ? result
            : fetcher.latestSuccess
        }
        fetcher.listeners.forEach((x) => x(result, latestSuccess!))
      },
      sync: Semaphore.unsafeMakeSemaphore(1),
    }
    ctx.fetchers[name] = fetcher
  }

  const getFetcher = useCallback(() => ctx.fetchers[name] as F, [ctx.fetchers, name])

  const modify = useModify<A>(name)

  // todo; just store inside the context
  const ff = useCallback(
    function (...args: Args) {
      return pipe(
        T.effectTotal(() => {
          getFetcher().modify((r) =>
            datumEither.isInitial(r)
              ? datumEither.constPending()
              : datumEither.toRefresh(r)
          )
        }),
        T.zipRight(fetchFunction(...args)),
        T.chain((a) =>
          T.effectTotal(() => {
            getFetcher().update(datumEither.success(a))
            return a
          })
        ),
        T.catchAll((err) => {
          getFetcher().update(datumEither.failure(err))
          return T.fail(err)
        }),
        T.result,
        T.chain(
          Ex.foldM(
            (cause) => {
              console.warn("exiting on cause", cause)
              // let's leave the error fiber, so that subsequent requests can share the result
              //   const f = getFetcher()
              //   f.fiber = null
              return T.halt(cause)
            },
            (v) => {
              // let's leave the success fiber, so that subsequent requests can share the result
              //   const f = getFetcher()
              //   f.fiber = null
              return T.succeed(v)
            }
          )
        )
      )
    },
    [fetchFunction, getFetcher]
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
    [ff, getFetcher]
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
    [ff, getFetcher]
  )

  const [{ latestSuccess, result }, setResult] = useState<
    Pick<F, "result" | "latestSuccess">
  >(() => ({
    result: getFetcher().result,
    latestSuccess: getFetcher().result,
  }))

  useEffect(() => {
    const fetcher = getFetcher()
    setResult({ result: fetcher.result, latestSuccess: fetcher.latestSuccess })
    const handler = (result: F["result"], latestSuccess: F["latestSuccess"]) => {
      setResult({ result, latestSuccess })
    }
    fetcher.listeners = A.snoc_(fetcher.listeners, handler)
    return () => {
      const fetcher = getFetcher()
      fetcher.listeners = A.deleteOrOriginal_(fetcher.listeners, handler)
      // TODO
      //   if (fetcher.listeners.length === 0) {
      //     console.log("deleting fetcher", name)
      //     delete ctx.fetchers[name]
      //   }
    }
  }, [ctx.fetchers, getFetcher, name])

  // we don't have the Args.. so looks like we need to receive the variables too..
  // we can then also use them for caching.
  //   useEffect(() => {
  //     const cancel = exec()["|>"](runWithErrorLog)
  //     return () => {
  //       cancel()
  //     }
  //   }, [exec, runWithErrorLog])

  return [result, latestSuccess, refetch, exec, modify] as const
}

export type PromiseExit<E = unknown, A = unknown> = Promise<Exit<E, A>>

export function onFail<E, T>(cb: (a: Cause<E>) => T) {
  return Ex.fold(cb, () => void 0)
}

export function onSuccess<A, T>(cb: (a: A) => T) {
  return Ex.fold(() => void 0, cb)
}
