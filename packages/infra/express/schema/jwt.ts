import { pipe } from "@effect-ts-demo/core/ext/Function"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { These as Th } from "@effect-ts-demo/core/ext/Schema"
import jwt_decode from "jwt-decode"

export const jwtIdentifier = Symbol.for("@effect-ts/schema/ids/jwt")

export const jwtFromString: S.Schema<
  string,
  any, //err
  unknown,
  unknown,
  never,
  string,
  {}
> = pipe(
  //S.identity((u): u is string => typeof u === "string"),
  S.identity((u): u is string => {
    throw new Error("Cannot id JWT")
  }),
  S.constructor((n) => Th.succeed(n)),
  //   S.arbitrary((_) => {
  //     throw new Error("Cannot arb JWT")
  //   }), // TODO
  //   S.encoder((_) => {
  //     throw new Error("can't encode")
  //   }),
  S.parser((p: string) => {
    try {
      return Th.succeed(jwt_decode(p))
    } catch (err) {
      return Th.fail("not a JWT: " + err)
    }
  }),
  S.mapApi(() => ({})),
  S.identified(jwtIdentifier, {})
)

export const jwt = S.string[">>>"](jwtFromString)
