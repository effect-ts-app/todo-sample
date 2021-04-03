import * as TodoClient from "@effect-ts-demo/todo-client"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { DefaultEnv } from "@effect-ts/core/Effect"
import { Has } from "@effect-ts/core/Has"
import { useCallback } from "react"

import { useConfig } from "./config"

export function useRun() {
  const config = useConfig()
  return useCallback(
    <E, A>(eff: T.Effect<DefaultEnv & Has<TodoClient.Tasks.ApiConfig>, E, A>) =>
      pipe(
        eff,
        T.provideSomeLayer(TodoClient.Tasks.LiveApiConfig(config)),
        T.runPromise
      ),
    [config]
  )
}
