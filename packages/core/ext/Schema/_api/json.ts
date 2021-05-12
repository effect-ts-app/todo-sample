import { pipe } from "../../Function"
import * as S from "../vendor"
import { These as Th } from "../vendor"
export const jsonIdentifier = Symbol.for("@effect-ts/schema/ids/json")

export const jsonFromString: S.Schema<
  string,
  any, //err
  unknown,
  unknown,
  never,
  string,
  {}
> = pipe(
  S.identity((u): u is string => typeof u === "string"),
  S.constructor((n) => Th.succeed(n)),
  //S.arbitrary((_) => _.anything()),
  S.encoder((_) => JSON.stringify(_)),
  S.parser((p: string) => {
    try {
      return Th.succeed(JSON.parse(p as any))
    } catch (err) {
      return Th.fail("not a JSON: " + err)
    }
  }),
  S.mapApi(() => ({})),
  S.identified(jsonIdentifier, {})
)

export const json = S.string[">>>"](jsonFromString)
