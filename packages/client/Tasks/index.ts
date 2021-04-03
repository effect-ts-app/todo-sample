import * as GetTasks from "@effect-ts-demo/todo-client/Tasks/GetTasks"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { decoder } from "@effect-ts/morphic/Decoder"
import fetch from "cross-fetch"
//import { encoder } from "@effect-ts/morphic/Encoder"

//const { encode } = encoder(GetTasks.Request)
const { decode } = decoder(GetTasks.Response)

export const getTasks = pipe(
  T.fromPromise(() => fetch("http://localhost:3330/tasks").then((r) => r.json())),
  T.chain(decode)
)
