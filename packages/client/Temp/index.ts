import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { flow } from "@effect-ts/core/Function"
import { decode } from "@effect-ts/morphic/Decoder"

import { fetchApi, mapResponseError } from "../fetch"

import * as GetMe from "./GetMe"

export { GetMe }

export const getMe = pipe(
  fetchApi("/me"),
  T.chain(flow(decode(GetMe.Response), mapResponseError))
)
