import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as Ex from "@effect-ts/express"
import { decoder, Errors } from "@effect-ts/morphic/Decoder"
import { encoder } from "@effect-ts/morphic/Encoder"
import express from "express"

import * as GetTask from "./GetTask"
import * as GetTasks from "./GetTasks"

class ValidationError {
  public readonly _tag = "ValidationError"
  constructor(public readonly error: Errors) {}
}

const mapValidationError = T.mapError((err: Errors) => new ValidationError(err))

function getRequestParams(req: express.Request) {
  return { ...req.query, ...req.body, ...req.params } as Record<string, unknown>
}

export const routes = T.tuple(
  Ex.get("/tasks/:Id", (req, res) => {
    const { decode } = decoder(GetTask.Request)
    const { encode } = encoder(GetTask.Response)
    return pipe(
      decode(getRequestParams(req))["|>"](mapValidationError),
      T.chain(GetTask.handle),
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
    )
  }),
  Ex.get("/tasks", (req, res) => {
    const { decode } = decoder(GetTasks.Request)
    const { encode } = encoder(GetTasks.Response)
    return pipe(
      decode(getRequestParams(req))["|>"](mapValidationError),
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
    )
  })
)
