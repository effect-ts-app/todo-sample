import { ParsedUrlQuery } from "querystring"

import * as S from "@effect-ts-app/core/Schema"
import { flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
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

export const parseOption = <E, A>(t: S.ReqRes<E, A>) => {
  // TODO: Clenup
  const dec = flow(S.Parser.for(t), (x) => {
    return x.effect._tag === "Right"
      ? x.effect.right.tuple[1]._tag === "None"
        ? O.some(x.effect.right.tuple[0])
        : O.none
      : O.none
  })
  return (_: E) => dec(_)
}
export const getQueryParamO = flow(getQueryParam, O.fromNullable)

// export const useRouteParam = (t: SchemaAny, key: string) => {
//   const r = useRouter()
//   return getQueryParamO(r.query, key)["|>"](O.chain(parseOption(t)))
// }
export const useRouteParams = <NER extends Record<string, S.SchemaAny>>(
  t: NER // enforce non empty
): {
  [K in keyof NER]: O.Option<S.ParsedShapeOf<NER[K]>>
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
      [K in keyof NER]: O.Option<S.ParsedShapeOf<NER[K]>>
    }
  )
}
