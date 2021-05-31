import { stringify, ParsedUrlQueryInput } from "querystring"

import { constant } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"

export * from "@effect-ts-app/core/utils"

export const typedKeysOf = <T>(obj: T) => Object.keys(obj) as (keyof T)[]

export function makeQueryString(pq: ParsedUrlQueryInput) {
  const qs = JSON.stringify(pq) // Drop undefined.
    ["|>"](JSON.parse)
    ["|>"](stringify)
  return qs ? "?" + qs : ""
}

export const constEmptyString = constant("")
export function renderIf<A, B>(f: (a: A) => B) {
  return (o: O.Option<A>) => renderIf_(o, f)
}

export function renderIf_<A, B>(o: O.Option<A>, f: (a: A) => B) {
  return O.map_(o, f)["|>"](O.toUndefined)
}
