import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"

import { pipe } from "../../Function"
import * as S from "../_schema"

import { constrained } from "./length"

export interface ReasonableStringBrand {
  readonly ReasonableString: unique symbol
}

// TODO: Email, Word etc
export type ReasonableString = S.NonEmptyString & ReasonableStringBrand

export const constrainedStringIdentifier =
  S.makeAnnotation<{ minLength: number; maxLength: number }>()
export function makeConstrainedFromString<Brand>(minLength: number, maxLength: number) {
  return pipe(
    S.fromString,
    S.arbitrary((FC) => FC.string({ minLength, maxLength })),
    constrained<ReasonableString>(minLength, maxLength),
    S.mapParserError((_) => Chunk.unsafeHead(_.errors).error),
    S.mapConstructorError((_) => Chunk.unsafeHead(_.errors).error),
    S.brand<Brand>(),
    S.annotate(constrainedStringIdentifier, {
      minLength,
      maxLength,
    })
  )
}
export const reasonableStringFromString = makeConstrainedFromString<ReasonableString>(
  1,
  256 - 1
)

export const reasonableString = pipe(S.string[">>>"](reasonableStringFromString))
