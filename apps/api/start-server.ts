import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import { decoder, Errors } from "@effect-ts/morphic/Decoder"
import { encoder } from "@effect-ts/morphic/Encoder"
import cors from "cors"

import { GetTasks } from "./Tasks"

class ValidationError {
  public readonly _tag = "ValidationError"
  constructor(public readonly error: Errors) {}
}

const mapValidationError = T.mapError((err: Errors) => new ValidationError(err))

const routes = T.tuple(
  Ex.get("/tasks", (req, res) => {
    const { decode } = decoder(GetTasks.Request)
    const { encode } = encoder(GetTasks.Response)
    return pipe(
      decode(req.body)["|>"](mapValidationError),
      T.chain(GetTasks.handle),
      T.chain(encode),
      T.chain((r) =>
        T.effectTotal(() => {
          res.status(200).send(r)
        })
      ),
      T.catch("_tag", "ValidationError", (err) =>
        T.effectTotal(() => {
          res.status(400).send(err.toString())
        })
      )
      //   T.catchAll((err) =>
      //     T.effectTotal(() => {
      //       res.status(500).send(err.toString())
      //     })
      //   )
    )
  })
)

const HOST = "127.0.0.1"
const PORT = 3330

const program = pipe(
  Ex.use(Ex.classic(cors())),
  T.zipRight(routes),
  T.tap(() => T.effectTotal(() => console.log(`Running on ${HOST}:${PORT}`))),
  T.tap(() => T.never)
)

pipe(program, T.provideSomeLayer(Ex.LiveExpress(HOST, PORT)), T.runPromiseExit)
  .then(console.log)
  .catch(console.error)
