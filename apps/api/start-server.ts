import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import { decoder } from "@effect-ts/morphic/Decoder"
import { encoder } from "@effect-ts/morphic/Encoder"

import { GetTask } from "./Tasks"

const routes = T.tuple(
  Ex.get("/tasks", (req, res) => {
    const { decode } = decoder(GetTask.Request)
    const { encode } = encoder(GetTask.Response)
    return pipe(
      decode(req.body)["|>"](
        T.mapError((err) => ({ _tag: "Validation" as const, error: err }))
      ),
      T.chain(GetTask.handle),
      T.chain(encode),
      T.chain((r) =>
        T.effectTotal(() => {
          res.body = r
        })
      ),
      T.catch("_tag", "Validation", (err) =>
        T.effectTotal(() => {
          res.body = err.toString()
          res.status = 400
        })
      )
      //   T.catchAll((err) =>
      //     T.effectTotal(() => {
      //       res.body = err.toString()
      //       res.status = 500
      //     })
      //   )
    )
  })
)

const HOST = "127.0.0.1"
const PORT = 6000
pipe(
  routes,
  T.provideSomeLayer(Ex.LiveExpress(HOST, PORT)),
  T.tap(() => T.effectTotal(() => console.log(`Running on ${HOST}:${PORT}`))),
  T.tap(() => T.never),
  T.runPromiseExit
)
  .then(console.log)
  .catch(console.error)
