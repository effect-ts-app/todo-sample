import * as T from "@effect-ts-demo/core/ext/Effect"
import { M } from "@effect-ts-demo/core/ext/Model"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Map from "@effect-ts/core/Collections/Immutable/Map"
import { flow, pipe } from "@effect-ts/core/Function"
import * as Sy from "@effect-ts/core/Sync"
import { encode } from "@effect-ts/morphic/Encoder"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"

//// Helpers
// eslint-disable-next-line @typescript-eslint/ban-types
export function makeCodec<E, A extends { id: Id }, Id>(t: M<{}, E, A>) {
  const { decode } = strictDecoder(t)
  const decodeOrDie = flow(decode, T.orDie)
  const encode = strictEncode(t)
  const encodeToMap = toMap(encode)
  return [decodeOrDie, encode, encodeToMap] as const
}

// eslint-disable-next-line @typescript-eslint/ban-types
function strictEncode<E, A>(t: M<{}, E, A>) {
  const { shrink } = strict(t)
  const enc = encode(t)
  return (u: A) => pipe(shrink(u), Sy.chain(enc))
}

function toMap<E, A extends { id: Id }, Id>(encode: (a: A) => Sy.UIO<E>) {
  return (a: A.Array<A>) =>
    pipe(
      A.map_(a, (task) => Sy.tuple(Sy.succeed(task.id as A["id"]), encode(task))),
      Sy.collectAll,
      Sy.map(Map.make)
    )
}
