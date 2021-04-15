import { ParsedUrlQuery } from "querystring"

import { flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as Sy from "@effect-ts/core/Sync"
import { AType, M } from "@effect-ts/morphic"
import { decode } from "@effect-ts/morphic/Decoder"
import { useRouter } from "next/router"

import { typedKeysOf } from "./utils"

export function getQueryParam(search: ParsedUrlQuery, param: string) {
  const v = search[param]
  if (Array.isArray(v)) {
    return v[0]
  }
  return v ?? null
}

// category = list = per route. throw 404 when missing.
// taskId per route
// order and order direction

export const parseOption = <E, A>(t: M<{}, E, A>) => {
  const dec = decode(t)
  return (_: E) => dec(_)["|>"](Sy.runEither)["|>"](O.fromEither)
}
export const getQueryParamO = flow(getQueryParam, O.fromNullable)

export const useRouteParam = <A>(t: M<{}, string, A>, key: string) => {
  const r = useRouter()
  return getQueryParamO(r.query, key)["|>"](O.chain(parseOption(t)))
}

export const useRouteParams = <NER extends Record<string, M<{}, string, any>>>(
  t: NER // enforce non empty
): {
  [K in keyof NER]: O.Option<AType<NER[K]>>
} => {
  const r = useRouter()
  return typedKeysOf(t).reduce(
    (prev, cur) => {
      prev[cur] = getQueryParamO(r.query, cur as string)["|>"](
        O.chain(parseOption(t[cur]))
      )
      return prev
    },
    {} as {
      [K in keyof NER]: AType<NER[K]>
    }
  )
}
