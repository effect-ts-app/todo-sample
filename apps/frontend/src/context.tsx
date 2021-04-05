import * as TodoClient from "@effect-ts-demo/todo-client"
import { ApiConfig } from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts/core/Effect"
import { pretty } from "@effect-ts/core/Effect/Cause"
import * as L from "@effect-ts/core/Effect/Layer"
import React, { createContext, ReactNode, useContext, useEffect, useMemo } from "react"

import { useConfig } from "./config"

function makeLayers(config: ApiConfig) {
  return TodoClient.LiveApiConfig(config)
}
type GetProvider<P> = P extends L.Layer<unknown, unknown, infer TP> ? TP : never
export type ProvidedEnv = T.DefaultEnv & GetProvider<ReturnType<typeof makeLayers>>

export interface ServiceContext {
  readonly provide: <E, A>(self: T.Effect<ProvidedEnv, E, A>) => T.Effect<unknown, E, A>
  readonly runWithErrorLog: <E, A>(self: T.Effect<ProvidedEnv, E, A>) => () => void
  readonly runPromise: <E, A>(self: T.Effect<ProvidedEnv, E, A>) => Promise<A>
}

const MissingContext = T.die(
  "service context not provided, wrap your app in LiveServiceContext"
)

const ServiceContext = createContext<ServiceContext>({
  provide: () => MissingContext,
  runWithErrorLog: () => runWithErrorLog(MissingContext),
  runPromise: () => T.runPromise(MissingContext),
})

export const LiveServiceContext = ({ children }: { children: ReactNode }) => {
  const config = useConfig()
  const provider = useMemo(() => L.unsafeMainProvider(makeLayers(config)), [config])

  const ctx = useMemo(
    () => ({
      provide: provider.provide,
      runWithErrorLog: <E, A>(self: T.Effect<ProvidedEnv, E, A>) =>
        runWithErrorLog(provider.provide(self)),
      runPromise: <E, A>(self: T.Effect<ProvidedEnv, E, A>) =>
        T.runPromise(provider.provide(self)),
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
