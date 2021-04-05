import * as A from "@effect-ts/core/Array"
import * as O from "@effect-ts/core/Option"

export function modifyAtOrOriginal_<A>(as: A.Array<A>, i: number, f: (a: A) => A) {
  return A.modifyAt_(as, i, f)["|>"](O.getOrElse(() => as))
}

export function modifyOrOriginal_<A>(as: A.Array<A>, a: A, f: (a: A) => A) {
  return modifyAtOrOriginal_(
    as,
    A.findIndex_(as, (x) => x === a)["|>"](O.getOrElse(() => -1)),
    f
  )
}

export function modifyAtOrOriginal<A>(i: number, f: (a: A) => A) {
  return (as: A.Array<A>) => modifyAtOrOriginal_(as, i, f)
}

export function modifyOrOriginal<A>(a: A, f: (a: A) => A) {
  return (as: A.Array<A>) => modifyOrOriginal_(as, a, f)
}

export * from "@effect-ts/core/Array"
