import * as S from "@effect-ts/schema"
import * as Th from "@effect-ts/schema/These"

import { pipe } from "../../Function"

/**
 * Turns the Constructor to Builder pattern: Expecting the A types.
 * useful on Record types.
 *
 * NOTE: Be sure to use this as high up as possible, as it will overwrite other compositions.
 */
export const asBuilder: <
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  ConstructedShape extends ParsedShape,
  Encoded,
  Api
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
) => S.Schema<
  ParserInput,
  ParserError,
  ParsedShape,
  ParsedShape, // ConstructorInput
  ConstructorError,
  ConstructedShape,
  Encoded,
  Api
> = (self) =>
  pipe(
    self,
    S.constructor((u) => Th.succeed(u as any))
  )
