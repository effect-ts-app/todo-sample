import { pipe } from "../../Function"
import * as S from "../_schema"
import { toTreeSymbol, These as Th } from "../_schema"

import { tree } from "./_shared"

export class ParseBoolE
  extends S.DefaultLeafE<{
    readonly actual: unknown
  }>
  implements S.Actual<unknown> {
  readonly _tag = "NotBool"

  get [toTreeSymbol]() {
    return tree(`cannot process ${JSON.stringify(this.actual)}, expected an string`)
  }
}

export function parseBoolE(actual: unknown): ParseBoolE {
  return new ParseBoolE({ actual })
}
export const boolIdentifier = Symbol.for("@effect-ts/schema/ids/bool")

export const bool: S.Schema<
  unknown,
  S.RefinementE<S.LeafE<ParseBoolE>>,
  boolean,
  boolean,
  never,
  boolean,
  boolean,
  {}
> = pipe(
  S.refinement(
    (u): u is boolean => typeof u === "boolean",
    (v) => S.leafE(parseBoolE(v))
  ),
  S.constructor((s: boolean) => Th.succeed(s)),
  S.arbitrary((_) => _.boolean()),
  S.encoder((s) => s),
  S.mapApi(() => ({})),
  S.identified(boolIdentifier, {})
)
