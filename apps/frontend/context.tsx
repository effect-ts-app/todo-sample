import * as HF from "@effect-ts-app/core/http/http-client-fetch"
import { makeApp } from "@effect-ts-app/react/context"
import * as T from "@effect-ts/core/Effect"
import * as Fiber from "@effect-ts/core/Effect/Fiber"
import * as L from "@effect-ts/core/Effect/Layer"
import { Semaphore } from "@effect-ts/system/Semaphore"
import { datumEither } from "@nll/datum"
import React, { createContext, useContext, useMemo } from "react"

import { TodoClient } from "@/index"

export function makeLayers(config: TodoClient.ApiConfig) {
  return TodoClient.LiveApiConfig(config)[">+>"](HF.Client(fetch))
}
type GetProvider<P> = P extends L.Layer<unknown, unknown, infer TP> ? TP : never
export type Env = GetProvider<ReturnType<typeof makeLayers>>
export type ProvidedEnv = T.DefaultEnv & Env

export const { LiveServiceContext, useServiceContext } = makeApp<Env>()

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
