import * as S from "@effect-ts-demo/core/ext/Schema"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import { flow } from "@effect-ts/core/Function"

import { fetchApi, mapResponseErrorS } from "../fetch"

import * as GetMe from "./GetMe"

export { GetMe }
export const getMe = pipe(
  fetchApi("/me"),
  T.chain(flow(S.Parser.for(GetMe.Response)["|>"](S.condemn), mapResponseErrorS))
)
