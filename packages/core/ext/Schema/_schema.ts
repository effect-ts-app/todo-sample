import * as S from "./vendor"

export type ParserOf<X extends S.Schema<any, any, any, any, any, any, any, any>> =
  S.Parser.Parser<S.ParserInputOf<X>, S.ParserErrorOf<X>, S.ParsedShapeOf<X>>

export type EncoderOf<X extends S.Schema<any, any, any, any, any, any, any, any>> =
  S.Encoder.Encoder<S.ParsedShapeOf<X>, S.EncodedOf<X>>

export type ConstructorOf<X extends S.Schema<any, any, any, any, any, any, any, any>> =
  S.Constructor.Constructor<
    S.ConstructorInputOf<X>,
    S.ConstructedShapeOf<X>,
    S.ConstructorErrorOf<X>
  >

export type GuardOf<X extends S.Schema<any, any, any, any, any, any, any, any>> =
  S.Guard.Guard<S.ParsedShapeOf<X>>

export type ArbOf<X extends S.Schema<any, any, any, any, any, any, any, any>> =
  S.Arbitrary.Arbitrary<S.ParsedShapeOf<X>>

export * from "./vendor"
