import * as S from "./vendor"

export type ParserOf<X extends S.SchemaAny> = S.Parser.Parser<
  S.ParserInputOf<X>,
  S.ParserErrorOf<X>,
  S.ParsedShapeOf<X>
>

export type EncoderOf<X extends S.SchemaAny> = S.Encoder.Encoder<
  S.ParsedShapeOf<X>,
  S.EncodedOf<X>
>

export type ConstructorOf<X extends S.SchemaAny> = S.Constructor.Constructor<
  S.ConstructorInputOf<X>,
  S.ParsedShapeOf<X>,
  S.ConstructorErrorOf<X>
>

export type GuardOf<X extends S.SchemaAny> = S.Guard.Guard<S.ParsedShapeOf<X>>

export type ArbOf<X extends S.SchemaAny> = S.Arbitrary.Arbitrary<S.ParsedShapeOf<X>>

export * from "./vendor"
