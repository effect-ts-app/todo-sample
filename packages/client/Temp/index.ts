import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { flow } from "@effect-ts/core/Function"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { decode } from "@effect-ts/morphic/Decoder"

import { fetchApi, mapResponseError } from "../fetch"

import * as GetMe from "./GetMe"
import * as GetTaskList from "./GetTaskList"

export { GetTaskList, GetMe }

export const getMe = pipe(
  fetchApi("/me"),
  T.chain(flow(decode(GetMe.Response), mapResponseError))
)

const decodeGetTaskListResponse = flow(decode(GetTaskList.Response), mapResponseError)
export const findTaskList = (id: UUID) =>
  pipe(fetchApi(`/task-lists/${id}`), T.chain(decodeGetTaskListResponse))
