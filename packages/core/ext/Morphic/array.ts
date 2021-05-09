import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"

import { flow } from "../Function"
import * as T from "../Sync"
import "@effect-ts/core/Operator"

export function interpretArray<A>(decode: (i: unknown) => T.IO<any, A>) {
  return <E>(ar: A.Array<E>) =>
    A.filterMap_(ar, flow(decode, T.runEither, O.fromEither))
}
