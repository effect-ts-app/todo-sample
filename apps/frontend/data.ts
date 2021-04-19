import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { Fiber, Semaphore } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { Cause } from "@effect-ts/core/Effect/Cause"
import * as Ex from "@effect-ts/core/Effect/Exit"
import { Exit } from "@effect-ts/core/Effect/Exit"
import * as E from "@effect-ts/core/Either"
import { pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { equals } from "@effect-ts/system/Structural/HasEquals"
import { datumEither } from "@nll/datum"
import { DatumEither } from "@nll/datum/DatumEither"
import React, { useState } from "react"

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
        T.succeedWith(() => setResult(datumEither.constPending())),
        T.zipRight(fetchFnc(...args)),
        T.tap((a) =>
          T.succeedWith(() => {
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
      T.succeedWith(() => {
        console.log("cancel", cancel)
        cancel()
      }),
      T.zipRight(
        pipe(
          self,
          T.fork,
          // NOTE; actually the cancellation means that running to Promise will also not resolve on the success channel.
          // thus additional callbacks will fail.
          T.tap((f) => T.succeedWith(() => setCancel(() => T.run(Fiber.interrupt(f)))))
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
      console.warn(`Fetch function for ${name} appears to be unstable`)
      ctx.fetchers[name].fetch = fetchFunction
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fetcher.listeners.forEach((x) => x(result, latestSuccess!))
      },
      sync: Semaphore.unsafeMakeSemaphore(1),
    }
    ctx.fetchers[name] = fetcher
  }

  const fetcher = useMemo(() => ctx.fetchers[name] as F, [ctx.fetchers, name])

  const modify = useModify<A>(name)

  // todo; just store inside the context
  const ff = useCallback(
    function (...args: Args) {
      return pipe(
        T.succeedWith(() => {
          fetcher.modify((r) =>
            datumEither.isInitial(r)
              ? datumEither.constPending()
              : datumEither.toRefresh(r)
          )
        }),
        T.zipRight(fetcher.fetch(...args)),
        T.chain((a) =>
          T.succeedWith(() => {
            fetcher.update(datumEither.success(a))
            return a
          })
        ),
        T.catchAll((err) => {
          fetcher.update(datumEither.failure(err))
          return T.fail(err)
        }),
        T.result,
        T.chain(
          Ex.foldM(
            (cause) => {
              console.warn("exiting on cause", cause)
              // let's leave the error fiber, so that subsequent requests can share the result
              //   fetcher.fiber = null
              return T.halt(cause)
            },
            (v) => {
              // let's leave the success fiber, so that subsequent requests can share the result
              //   fetcher.fiber = null
              return T.succeed(v)
            }
          )
        )
      )
    },
    [fetcher]
  )

  // joins existing fiber when available, even when old.
  const exec = useCallback(
    function (...args: Args) {
      return pipe(
        T.succeedWith(() => fetcher.fiber),
        T.chain((f) =>
          f
            ? T.succeedWith(() => {
                console.log("Joining existing fiber", f.id)
                return f
              })
            : pipe(
                ff(...args),
                T.fork,
                T.tap((f) =>
                  T.succeedWith(() => {
                    console.log("setting fiber", f.id)
                    fetcher.fiber = f
                  })
                )
              )
        ),
        Semaphore.withPermit(fetcher.sync),
        T.chain(Fiber.join)
      )
    },
    [ff, fetcher]
  )

  // kills existing fiber when available and refetches
  const refetch = useCallback(
    (...args: Args) =>
      pipe(
        ff(...args),
        T.fork,
        T.tap((f) => {
          const runFib = fetcher.fiber
          if (runFib) {
            console.log("interrupting fiber", runFib.id)
          }
          const setFiber = T.succeedWith(() => {
            console.log("setting fiber", f.id)
            fetcher.fiber = f
          })
          return runFib
            ? Fiber.interrupt(runFib)["|>"](T.chain(() => setFiber))
            : setFiber
        }),
        Semaphore.withPermit(fetcher.sync),
        T.chain(Fiber.join)
      ),
    [ff, fetcher]
  )

  const [{ latestSuccess, result }, setResult] = useState<
    Pick<F, "result" | "latestSuccess">
  >(() => ({
    result: fetcher.result,
    latestSuccess: fetcher.result,
  }))

  useEffect(() => {
    setResult({ result: fetcher.result, latestSuccess: fetcher.latestSuccess })
    const handler = (result: F["result"], latestSuccess: F["latestSuccess"]) => {
      setResult({ result, latestSuccess })
    }
    fetcher.listeners = A.snoc_(fetcher.listeners, handler)
    return () => {
      A.findIndex_(fetcher.listeners, (x) => x === handler)
        ["|>"](O.chain((idx) => A.deleteAt_(fetcher.listeners, idx)))
        ["|>"](
          O.fold(
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            () => {},
            (l) => (fetcher.listeners = l)
          )
        )
      // TODO
      //   if (fetcher.listeners.length === 0) {
      //     console.log("deleting fetcher", name)
      //     delete ctx.fetchers[name]
      //   }
    }
  }, [fetcher])

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

/**
 *
const something = {}
assert.strictEqual(shallowEqual({ a: O.none }, { a: O.none }), true)
assert.strictEqual(shallowEqual({ a: O.some(1)}, { a: O.some(1) }), true)
assert.strictEqual(shallowEqual({ a: O.some(something)}, { a: O.some(something) }), true)
assert.strictEqual(shallowEqual({ a: O.some(something)}, { a: O.none }), false)

assert.strictEqual(shallowEqual({ a: E.left(something)}, { a: E.left(something) }), true)
assert.strictEqual(shallowEqual({ a: E.right(something)}, { a: E.left(something) }), false)
assert.strictEqual(shallowEqual({ a: E.left(1)}, { a: E.left(2) }), false)
assert.strictEqual(shallowEqual({ a: E.right(1)}, { a: E.right(2) }), false)

// Works by default
assert.strictEqual(shallowEqual(1, 1), true)
assert.strictEqual(shallowEqual(1, 0), false)
assert.strictEqual(shallowEqual(O.none, O.none), true)
assert.strictEqual(shallowEqual(O.some(something), O.some(something)), true)
assert.strictEqual(shallowEqual(O.some(something), O.none), false)

assert.strictEqual(shallowEqual(E.left(something), E.left(something)), true)
assert.strictEqual(shallowEqual(E.right(something), E.left(something)), false)
assert.strictEqual(shallowEqual(E.left(1), E.left(2)), false)
assert.strictEqual(shallowEqual(E.right(1), E.right(2)), false)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function shallowEqual(objA: any, objB: any) {
  if (Object.is(objA, objB)) {
    return true
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) {
    return false
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.hasOwnProperty.call(objB, keysA[i])) {
      return false
    }
    // supports effect-ts hash and equals implementations
    if (!equals(objA[keysA[i]], objB[keysA[i]])) {
      return false
    }
  }

  return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memo<T extends React.ComponentType<any>>(f: T) {
  return React.memo(f, shallowEqual)
}

export function useEffect(effect: React.EffectCallback, deps: React.DependencyList) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useEffect(effect, mapDeps(deps))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(callback, mapDeps(deps))
}

export function useMemo<T>(factory: () => T, deps: React.DependencyList) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(factory, mapDeps(deps))
}

function mapDeps(deps: React.DependencyList) {
  return deps.map(convertDep)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertDep(x: any) {
  return typeof x !== "object" || x === null
    ? x
    : O.isSome(x) || O.isNone(x)
    ? O.toNullable(x)
    : E.isLeft(x)
    ? x.left
    : E.isRight(x)
    ? x.right
    : x
}

// alternative, but it is hard because query string can be parsed to string, string[], number, etc.
// export function useRoute<E extends Record<string, any>, A>(t: M<{}, E, A>) {
//   const r = useRouter()
//   const dec = decode(t)
//   return dec(r.query)
// }

export type WithLoading<Fnc> = Fnc & {
  loading: boolean
}

export function withLoading<Fnc>(fnc: Fnc, loading: boolean): WithLoading<Fnc> {
  return Object.assign(fnc, { loading })
}

export function useReportLoading(name: string) {
  return useEffect(() => {
    console.log("$$$ loaded", name)

    return () => console.log("$$$ unloaded", name)
  }, [name])
}
