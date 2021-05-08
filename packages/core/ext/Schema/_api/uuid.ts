import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { UUIDBrand, UUID as LUUID } from "@effect-ts/morphic/Algebra/Primitives"
import { regexUUID } from "@effect-ts/morphic/Decoder/interpreter/primitives"
import * as S from "@effect-ts/schema"
import { fromString } from "@effect-ts/schema"

import { pipe, Refinement } from "../../Function"
import { makeUuid } from "../../Model"
import { toTreeSymbol } from "../vendor"

import { tree } from "./_shared"

export type UUID = S.NonEmptyString & UUIDBrand & S.NonEmptyBrand & LUUID // bwc

export const UUIDFromStringIdentifier = Symbol.for("@effect-ts/schema/ids/UUID")

const isUUID: Refinement<string, UUID> = (s: string): s is UUID => {
  return regexUUID.test(s)
}

export class ParseUUIDE
  extends S.DefaultLeafE<{
    readonly actual: unknown
  }>
  implements S.Actual<unknown> {
  readonly _tag = "NotUUID"

  get [toTreeSymbol]() {
    return tree(`cannot process ${JSON.stringify(this.actual)}, expected an UUID`)
  }
}

export function parseUUIDE(actual: unknown): ParseUUIDE {
  return new ParseUUIDE({ actual })
}

export const UUIDFromString = pipe(
  fromString,
  S.arbitrary((FC) => FC.uuid()),
  S.nonEmpty,
  S.refine(isUUID, (n) => S.leafE(parseUUIDE(n))),
  S.mapParserError((_) => Chunk.unsafeHead(_.errors).error),
  S.mapConstructorError((_) => Chunk.unsafeHead(_.errors).error),
  S.brand((_) => _ as UUID),
  S.identified(UUIDFromStringIdentifier, {})
)

export const UUID = S.string[">>>"](UUIDFromString)

export const withDefaultUuidId = S.withDefaultConstructorField("id", makeUuid)
