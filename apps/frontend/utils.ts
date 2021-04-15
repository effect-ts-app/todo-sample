export function toUpperCaseFirst(s: string) {
  const f = (s[0] ?? "").toUpperCase()
  return `${f}${s.slice(1)}`
}

export const typedKeysOf = <T>(obj: T) => Object.keys(obj) as (keyof T)[]
