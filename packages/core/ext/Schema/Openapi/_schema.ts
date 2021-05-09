import type { JSONSchema } from "@atlas-ts/plutus"

import { HasContinuation, Schema, SchemaAny, SchemaContinuationSymbol } from "../vendor"

type JsonSchema<T> = JSONSchema

export class SchemaOpenApi<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    ConstructedShape extends ParsedShape,
    Encoded,
    Api
  >
  extends Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    ConstructedShape,
    Encoded,
    Api
  >
  implements HasContinuation {
  readonly Api = this.self.Api;
  readonly [SchemaContinuationSymbol]: SchemaAny
  constructor(
    readonly self: Schema<
      ParserInput,
      ParserError,
      ParsedShape,
      ConstructorInput,
      ConstructorError,
      ConstructedShape,
      Encoded,
      Api
    >,
    readonly jsonSchema: () => JsonSchema<ParsedShape>
  ) {
    super()
    this[SchemaContinuationSymbol] = self
  }
}

export function openapi<A extends ParsedShape, ParsedShape>(f: () => JsonSchema<A>) {
  return <
    ParserInput,
    ParserError,
    ConstructorInput,
    ConstructorError,
    ConstructedShape extends ParsedShape,
    Encoded,
    Api
  >(
    self: Schema<
      ParserInput,
      ParserError,
      ParsedShape,
      ConstructorInput,
      ConstructorError,
      ConstructedShape,
      Encoded,
      Api
    >
  ): Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    ConstructedShape,
    Encoded,
    Api
  > => new SchemaOpenApi(self, f) as any
}

export function openapi_<
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  ConstructedShape extends ParsedShape,
  Encoded,
  Api
>(
  self: Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    ConstructedShape,
    Encoded,
    Api
  >,
  f: () => JsonSchema<ParsedShape>
): Schema<
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  ConstructedShape,
  Encoded,
  Api
> {
  return new SchemaOpenApi(self, f)
}
