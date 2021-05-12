import { useUser } from "@auth0/nextjs-auth0"
import { Fiber, pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { pretty } from "@effect-ts/core/Effect/Cause"
import * as L from "@effect-ts/core/Effect/Layer"
import { Exit } from "@effect-ts/system/Exit"
import { Semaphore } from "@effect-ts/system/Semaphore"
import { datumEither } from "@nll/datum"
import React, { createContext, ReactNode, useContext, useEffect, useMemo } from "react"

import { TodoClient } from "@/index"

import { useConfig } from "./config"

import * as HF from "@effect-ts-demo/core/http/http-client-fetch"

function makeLayers(config: TodoClient.ApiConfig) {
  return TodoClient.LiveApiConfig(config)[">+>"](HF.Client(fetch))
}
type GetProvider<P> = P extends L.Layer<unknown, unknown, infer TP> ? TP : never
export type ProvidedEnv = T.DefaultEnv & GetProvider<ReturnType<typeof makeLayers>>

export interface ServiceContext {
  readonly provide: <E, A>(self: T.Effect<ProvidedEnv, E, A>) => T.Effect<unknown, E, A>
  readonly runWithErrorLog: <E, A>(self: T.Effect<ProvidedEnv, E, A>) => () => void
  readonly runPromise: <E, A>(self: T.Effect<ProvidedEnv, E, A>) => Promise<Exit<E, A>>
}

const MissingContext = T.die(
  "service context not provided, wrap your app in LiveServiceContext"
)

const ServiceContext = createContext<ServiceContext>({
  provide: () => MissingContext,
  runWithErrorLog: () => runWithErrorLog(MissingContext),
  runPromise: () => runPromiseWithErrorLog(MissingContext),
})

export const LiveServiceContext = ({ children }: { children: ReactNode }) => {
  const cfg = useConfig()
  //   const { user } = useUser()
  const config = useMemo(
    () => ({
      ...cfg,
      userProfileHeader: JSON.stringify({
        sub:
          (typeof sessionStorage !== "undefined" &&
            sessionStorage.getItem("user-id")) ||
          "0",
      }),
    }),
    [cfg]
  )
  const provider = useMemo(() => L.unsafeMainProvider(makeLayers(config)), [config])

  const ctx = useMemo(
    () => ({
      provide: provider.provide,
      runWithErrorLog: <E, A>(self: T.Effect<ProvidedEnv, E, A>) =>
        runWithErrorLog(provider.provide(self)),
      runPromise: <E, A>(self: T.Effect<ProvidedEnv, E, A>) =>
        runPromiseWithErrorLog(provider.provide(self)),
    }),
    [provider]
  )

  useEffect(() => {
    const cancel = T.runCancel(provider.allocate)
    return () => {
      T.run(cancel)
      T.run(provider.release)
    }
  }, [provider])

  return <ServiceContext.Provider value={ctx}>{children}</ServiceContext.Provider>
}

export const useServiceContext = () => useContext(ServiceContext)

function runWithErrorLog<E, A>(self: T.Effect<unknown, E, A>) {
  const cancel = T.runCancel(self, (ex) => {
    if (ex._tag === "Failure") {
      console.error(pretty(ex.cause))
    }
  })
  return () => {
    T.run(cancel)
  }
}

function runPromiseWithErrorLog<E, A>(self: T.Effect<unknown, E, A>) {
  return pipe(self, T.runPromiseExit).then((ex) => {
    if (ex._tag === "Failure") {
      console.error(pretty(ex.cause))
    }
    return ex
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Fetcher<E = any, Err = any, A = any, Fnc = any> = {
  cancel: () => void
  fetch: Fnc
  fiber: Fiber.FiberContext<E, A> | null
  result: datumEither.DatumEither<Err, A>
  latestSuccess: datumEither.DatumEither<Err, A>
  listeners: readonly ((
    result: datumEither.DatumEither<Err, A>,
    latestSuccess: datumEither.DatumEither<Err, A>
  ) => void)[]
  modify: (
    mod: (c: datumEither.DatumEither<Err, A>) => datumEither.DatumEither<Err, A>
  ) => void
  update: (
    result: datumEither.DatumEither<Err, A>,
    latestSuccess?: datumEither.DatumEither<Err, A>
  ) => void
  sync: Semaphore
}

type FetchContext = {
  fetchers: Record<string, Fetcher>
}
const FetchContext = createContext<FetchContext>({ fetchers: {} })
export const useFetchContext = () => useContext(FetchContext)
export const LiveFetchContext = ({ children }: { children: React.ReactNode }) => {
  const ctx = useMemo(() => ({ fetchers: {} }), [])
  return <FetchContext.Provider value={ctx}>{children}</FetchContext.Provider>
}
