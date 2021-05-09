import * as T from "@effect-ts-demo/core/ext/Effect"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { Parser, Encoder } from "@effect-ts-demo/core/ext/Schema"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Map from "@effect-ts/core/Collections/Immutable/Map"
import { flow, pipe } from "@effect-ts/core/Function"
import * as Sy from "@effect-ts/core/Sync"

export function makeCodec<
  ParserInput,
  ParserError,
  ParsedShape extends { id: Id },
  ConstructorInput,
  ConstructorError,
  ConstructedShape extends ParsedShape,
  Encoded,
  Api,
  Id
>(
  self: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    ConstructedShape,
    Encoded,
    Api
  >
) {
  // TODO: strict
  const decode = flow(Parser.for(self)["|>"](S.condemn), T.orDie)
  const enc = Encoder.for(self)

  const encode = (u: ParsedShape) => Sy.succeedWith(() => enc(u))
  const encodeToMap = toMap(encode)
  return [decode, encode, encodeToMap] as const
}

function toMap<E, A extends { id: Id }, Id>(encode: (a: A) => Sy.UIO<E>) {
  return (a: A.Array<A>) =>
    pipe(
      A.map_(a, (task) => Sy.tuple(Sy.succeed(task.id as A["id"]), encode(task))),
      Sy.collectAll,
      Sy.map(Map.make)
    )
}
