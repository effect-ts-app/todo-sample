import * as TodoClient from "@effect-ts-demo/todo-client"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { DefaultEnv } from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"

import { config } from "./config"

const layers = TodoClient.Tasks.LiveApiConfig(config)
const run = <E, A>(eff: T.Effect<ProvidedEnv, E, A>) =>
  pipe(eff, T.provideSomeLayer(layers), T.runPromise)

export function useRun() {
  return run
}

type GetProvider<P> = P extends L.Layer<unknown, unknown, infer TP> ? TP : never
export type ProvidedEnv = DefaultEnv & GetProvider<typeof layers>
