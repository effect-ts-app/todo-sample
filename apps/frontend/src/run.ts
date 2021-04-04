import * as TodoClient from "@effect-ts-demo/todo-client"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { DefaultEnv } from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { useCallback, useMemo } from "react"

import { useConfig } from "./config"

export function useRun() {
  const layers = useLayers()
  return useCallback(
    <E, A>(eff: T.Effect<ProvidedEnv, E, A>) =>
      pipe(eff, T.provideSomeLayer(layers), T.runPromise),
    [layers]
  )
}

const useLayers = () => {
  const config = useConfig()
  return useMemo(() => TodoClient.Tasks.LiveApiConfig(config), [config])
}

type GetProvider<P> = P extends L.Layer<unknown, unknown, infer TP> ? TP : never
export type ProvidedEnv = DefaultEnv & GetProvider<ReturnType<typeof useLayers>>
