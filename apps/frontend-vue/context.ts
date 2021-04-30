import * as T from '@effect-ts/core/Effect'
import { pretty } from '@effect-ts/core/Effect/Cause'
import { pipe, flow } from '@effect-ts/core/Function'
import * as L from '@effect-ts/core/Effect/Layer'
import { ApiConfig } from '@effect-ts-demo/todo-client'
import * as TodoClient from '@effect-ts-demo/todo-client'

const config = Object.freeze({
  apiUrl: 'http://localhost:3330', // '/api'
})

function makeLayers(config: ApiConfig) {
  return TodoClient.LiveApiConfig(config)
}
type GetProvider<P> = P extends L.Layer<unknown, unknown, infer TP> ? TP : never
export type ProvidedEnv = T.DefaultEnv &
  GetProvider<ReturnType<typeof makeLayers>>

function runWithErrorLog<E, A>(self: T.Effect<unknown, E, A>) {
  const cancel = T.runCancel(self, (ex) => {
    if (ex._tag === 'Failure') {
      console.error(pretty(ex.cause))
    }
  })
  return () => {
    T.run(cancel)
  }
}

function runPromiseWithErrorLog<E, A>(self: T.Effect<unknown, E, A>) {
  return pipe(self, T.runPromiseExit).then((ex) => {
    if (ex._tag === 'Failure') {
      console.error(pretty(ex.cause))
    }
    return ex
  })
}

function makeContext() {
  // const provider = L.unsafeMainProvider(makeLayers(config))
  const provide = T.provideLayer(makeLayers(config))

  // const run = <E, A>(self: T.Effect<ProvidedEnv, E, A>) =>
  //   runWithErrorLog(provider.provide(self))
  // const runPromise = <E, A>(self: T.Effect<ProvidedEnv, E, A>) =>
  //   runPromiseWithErrorLog(provider.provide(self))
  return {
    // provide: provider.provide,
    provide,
    run: flow(provide, runWithErrorLog),
    runPromise: flow(provide, runPromiseWithErrorLog),
  }
}

const { run, runPromise, provide } = makeContext()
export { run, runPromise, provide }
