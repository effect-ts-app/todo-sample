import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"

import * as S from "../_schema"

export const empty = Chunk.empty<never>()
export function tree<A>(value: A, forest: S.Forest<A> = empty): S.Tree<A> {
  return {
    value,
    forest,
  }
}
