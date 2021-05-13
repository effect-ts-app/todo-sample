import { pipe } from "@effect-ts/core/Function"

import * as S from "../vendor"
import { Encoder, Parser } from "../vendor"

export class UserProfile extends S.Model<UserProfile>()(
  S.required({ id: S.nonEmptyString, email: S.nonEmptyString })
) {}
export type AnyRecordSchema = S.Schema<
  unknown,
  any,
  AnyRecord,
  any,
  any,
  AnyRecord,
  any
>

export type TODO = any
export type AnyRecord = Record<string, any>

type Rename<T, K extends keyof T, N extends string> = Pick<T, Exclude<keyof T, K>> &
  { [P in N]: T[K] }

// TODO: e.g when mapping to openAPI, we should be able to pick up on the changed key names
// as that's what should be used in the spec.
// TODO: version with multiple field mappings.
export function mapField<
  ParserInput,
  ParserError,
  ParsedShape extends AnyRecord,
  ConstructorInput,
  ConstructorError,
  Encoded extends AnyRecord,
  Api,
  DestKey extends string,
  Key extends string
>(
  self: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >,
  mappingFrom: Key, // TODO: From key should be constrained.
  mappingTo: DestKey
): S.Schema<
  unknown,
  ParserError, // TODO
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  Rename<Encoded, Key, DestKey>,
  Api
> {
  const enc = Encoder.for(self)
  const parse = Parser.for(self)
  return pipe(
    S.identity((_): _ is Record<any, any> => typeof _ === "object" && _ !== null),
    S.encoder((_) => {
      const e = enc(_)
      const no: any = {}
      for (const key in e) {
        no[(key as any) === mappingFrom ? mappingTo : key] = _[key]
      }
      return no
    }),
    S.parser((_: Record<any, any>) => {
      const no: any = {}
      for (const key in _) {
        no[key === mappingTo ? mappingFrom : key] = _[key]
      }
      return parse(no)
    })
  ) as any
}
