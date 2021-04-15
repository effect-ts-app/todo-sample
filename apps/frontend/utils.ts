import { stringify, ParsedUrlQueryInput } from "querystring"

export function toUpperCaseFirst(s: string) {
  const f = (s[0] ?? "").toUpperCase()
  return `${f}${s.slice(1)}`
}

export const typedKeysOf = <T>(obj: T) => Object.keys(obj) as (keyof T)[]

export function makeQueryString(pq: ParsedUrlQueryInput) {
  const qs = JSON.stringify(pq) // Drop undefined.
    ["|>"](JSON.parse)
    ["|>"](stringify)
  return qs ? "?" + qs : ""
}
