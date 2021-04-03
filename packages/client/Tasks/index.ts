import * as GetTasks from "@effect-ts-demo/todo-client/Tasks/GetTasks"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { tag } from "@effect-ts/core/Has"
import { decoder } from "@effect-ts/morphic/Decoder"
import * as Layer from "@effect-ts/system/Layer"
import fetch from "cross-fetch"
//import { encoder } from "@effect-ts/morphic/Encoder"

//const { encode } = encoder(GetTasks.Request)
const { decode } = decoder(GetTasks.Response)

export interface ApiConfig {
  api: string
}

export const ApiConfig = tag<ApiConfig>()

const getConfig = T.accessServiceM(ApiConfig)

export const LiveApiConfig = (config: ApiConfig) =>
  Layer.fromFunction(ApiConfig)(() => config)

export const getTasks = pipe(
  getConfig(({ api }) =>
    T.fromPromise(() => fetch(`${api}/tasks`).then((r) => r.json()))
  ),
  T.chain(decode)
)
