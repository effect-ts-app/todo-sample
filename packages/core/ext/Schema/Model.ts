/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Lens from "@effect-ts/monocle/Lens"
import { unsafe } from "@effect-ts/schema/_api/condemn"

import type { Compute } from "../Compute"

import * as S from "./_schema"
import { fromFields, schemaField } from "./_schema"

export const requestBrand = Symbol()

export type SchemaForModel<M, Self extends S.SchemaAny> = S.Schema<
  S.ParserInputOf<Self>,
  S.ParserErrorOf<Self>,
  M,
  Compute<S.ConstructorInputOf<Self>>,
  S.ConstructorErrorOf<Self>,
  M,
  Compute<S.EncodedOf<Self>>,
  S.ApiOf<Self> & S.ApiSelfType<M>
>

export interface Model<M, Self extends S.SchemaAny>
  extends Model2<Self, M, SchemaForModel<M, Self>> {
  [schemaField]: Self
}

interface Model2<Self extends S.SchemaAny, M, SelfM extends S.SchemaAny> {
  readonly [schemaField]: SelfM
  readonly lens: Lens.Lens<M, M>
  readonly Model: SelfM
  readonly Parser: S.ParserOf<SelfM>
  readonly Encoder: S.EncoderOf<SelfM>
  readonly Guard: S.GuardOf<SelfM>
  readonly Arbitrary: S.ArbOf<SelfM>
  readonly Constructor: S.ConstructorOf<SelfM>
  new (_: Compute<S.ConstructorInputOf<Self>>): Compute<S.ParsedShapeOf<Self>>
}

// TODO: Somehow ensure that Self and M are related..
//type Ensure<M, Self extends S.SchemaAny> = M extends S.ParsedShapeOf<Self> ? M : never

export function Model<M>() {
  return <Self extends S.Schema<any, any, any, any, any, any, any, any>>(
    self: Self
  ): Model<M, Self> => {
    const of_ = S.Constructor.for(self)["|>"](unsafe)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return class {
      static [schemaField] = self
      static get Model() {
        return this[schemaField]
      }
      static [requestBrand] = requestBrand

      static Parser = S.Parser.for(self)
      static Encoder = S.Encoder.for(self)
      static Constructor = S.Constructor.for(self)
      static Guard = S.Guard.for(self)
      static Arbitrary = S.Arbitrary.for(self)

      static lens = Lens.id<any>()

      constructor(inp?: S.ConstructorInputOf<Self>) {
        if (inp) {
          this[fromFields](of_(inp))
        }
      }
      [fromFields](fields: any) {
        for (const k of Object.keys(fields)) {
          // @ts-expect-error !!!
          this[k] = fields[k]
        }
      }
    }
  }
}

// export function schema<Self extends ModelOut<any>>(self: Self) {
//   const guard = (u: unknown): u is ShapeFromClass<Self> => u instanceof self
//   const of_ = S.Constructor.for(self[schemaField])
//   const parse_ = S.Parser.for(self[schemaField])
//   const arb = Arbitrary.for(self[schemaField])

//   const schema = pipe(
//     self[schemaField],
//     S.guard(guard),
//     S.constructor((u: any): any => {
//       const res = of_(u)
//       if (res.effect._tag === "Left") {
//         return Th.fail(res.effect.left)
//       }
//       const warnings = res.effect.right.get(1)
//       const out = res.effect.right.get(0)
//       // @ts-expect-error
//       const x = new self()
//       x[fromFields](out)
//       if (warnings._tag === "Some") {
//         return Th.warn(x, warnings.value)
//       }
//       return Th.succeed(x)
//     }),
//     S.parser((u: any): any => {
//       const res = parse_(u)
//       if (res.effect._tag === "Left") {
//         return Th.fail(res.effect.left)
//       }
//       const warnings = res.effect.right.get(1)
//       const out = res.effect.right.get(0)
//       // @ts-expect-error
//       const x = new self()
//       x[fromFields](out)
//       if (warnings._tag === "Some") {
//         return Th.warn(x, warnings.value)
//       }
//       return Th.succeed(x)
//     }),
//     S.arbitrary((_) =>
//       arb(_).map((out) => {
//         // @ts-expect-error
//         const x = new self()
//         x[fromFields](out)
//         return x
//       })
//     ),
//     S.mapApi(() => self[schemaField].Api)
//   )

//   return schema as SchemaForModel<Self>
// }

export type ReqRes<E, A> = S.Schema<
  unknown, //ParserInput,
  unknown, // S.AnyError //ParserError,
  A, //ParsedShape,
  any, //ConstructorInput,
  any, //ConstructorError,
  any, //ConstructedShape extends ParsedShape,
  E, //Encoded,
  any //Api
>
export type ReqResSchemed<E, A> = {
  Encoder: S.Encoder.Encoder<A, E>
  Model: ReqRes<E, A>
} //Model<M, ReqRes<E, A>> // ?

export function extractSchema<ResE, ResA>(
  Res_: ReqRes<ResE, ResA> | ReqResSchemed<ResE, ResA>
) {
  const res_ = Res_ as any
  const Res = res_[schemaField]
    ? (res_.Model as ReqRes<ResE, ResA>)
    : (res_ as ReqRes<ResE, ResA>)
  return Res
}
