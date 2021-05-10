/// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/system/Function"

import * as S from "../_schema"
import type { Arbitrary, Encoder, Parser, Constructor, Guard, UnionE } from "../_schema"
import { These as Th } from "../_schema"

// export interface TagApi<K> {
//   value: K
// }

// export const tagIdentifier = Symbol.for("@effect-ts/schema/ids/tag")

export interface UnionApi //<Props extends readonly S.SchemaAny[]>
  extends S.ApiSelfType<unknown> {}

// export interface TaggedApi<
//   Key extends string,
//   Props extends readonly SchemaK<Key, string>[]
// > extends ApiSelfType<unknown> {
//   readonly of: {
//     [K in Props[number]["Api"]["fields"][Key]["value"]]: (
//       _: {
//         [H in keyof Props]: Props[H] extends S.SchemaAny
//           ? S.ParsedShapeOf<Props[H]> extends { readonly [k in Key]: K }
//             ? S.ConstructorInputOf<Props[H]>
//             : never
//           : never
//       }[number]
//     ) => Th.These<
//       UnionE<
//         {
//           [K in keyof Props]: Props[K] extends S.SchemaAny
//             ? S.MemberE<
//                 S.ConstructedShapeOf<Props[K]>[Key],
//                 S.ConstructorErrorOf<Props[K]>
//               >
//             : never
//         }[number]
//       >,
//       S.GetApiSelfType<
//         this,
//         {
//           [K in keyof Props]: Props[K] extends S.SchemaAny
//             ? S.ParsedShapeOf<Props[K]>
//             : never
//         }[number]
//       >
//     >
//   }
//   readonly matchS: <A>(
//     _: {
//       [K in Props[number]["Api"]["fields"][Key]["value"]]: (
//         _: Extract<
//           {
//             [K in keyof Props]: Props[K] extends S.SchemaAny
//               ? S.ParsedShapeOf<Props[K]>
//               : never
//           }[number],
//           {
//             [k in Key]: K
//           }
//         >
//       ) => A
//     }
//   ) => (
//     ks: S.GetApiSelfType<
//       this,
//       {
//         [K in keyof Props]: Props[K] extends S.SchemaAny
//           ? S.ParsedShapeOf<Props[K]>
//           : never
//       }[number]
//     >
//   ) => A
//   readonly matchW: <
//     M extends {
//       [K in Props[number]["Api"]["fields"][Key]["value"]]: (
//         _: Extract<
//           {
//             [K in keyof Props]: Props[K] extends S.SchemaAny
//               ? S.ParsedShapeOf<Props[K]>
//               : never
//           }[number],
//           {
//             [k in Key]: K
//           }
//         >
//       ) => any
//     }
//   >(
//     _: M
//   ) => (
//     ks: S.GetApiSelfType<
//       this,
//       {
//         [K in keyof Props]: Props[K] extends S.SchemaAny
//           ? S.ParsedShapeOf<Props[K]>
//           : never
//       }[number]
//     >
//   ) => {
//     [K in keyof M]: ReturnType<M[K]>
//   }[keyof M]
// }

export const unionIdentifier = Symbol.for("@effect-ts/schema/ids/union")

export function union<Props extends readonly S.SchemaAny[]>(
  ...props: Props
): S.Schema<
  unknown,
  S.CompositionE<
    | S.PrevE<S.LeafE<S.ExtractKeyE>>
    | S.NextE<
        UnionE<
          {
            [K in keyof Props]: Props[K] extends S.SchemaAny
              ? S.MemberE<K, S.ParserErrorOf<Props[K]>>
              : never
          }[number]
        >
      >
  >,
  {
    [K in keyof Props]: Props[K] extends S.SchemaAny ? S.ParsedShapeOf<Props[K]> : never
  }[number],
  {
    [K in keyof Props]: Props[K] extends S.SchemaAny
      ? S.ConstructorInputOf<Props[K]>
      : never
  }[number],
  UnionE<
    {
      [K in keyof Props]: Props[K] extends S.SchemaAny
        ? S.MemberE<K, S.ConstructorErrorOf<Props[K]>>
        : never
    }[number]
  >,
  {
    [K in keyof Props]: Props[K] extends S.SchemaAny
      ? S.ConstructedShapeOf<Props[K]>
      : never
  }[number],
  {
    [K in keyof Props]: Props[K] extends S.SchemaAny ? S.EncodedOf<Props[K]> : never
  }[number],
  UnionApi
> {
  //const propsObj = {}
  const guards = [] as Guard.Guard<unknown>[]
  const parsers = [] as Parser.Parser<unknown, unknown, unknown>[]
  const encoders = [] as Encoder.Encoder<unknown, unknown>[]
  const constructors = [] as Constructor.Constructor<unknown, unknown, unknown>[]
  //const ofs = []
  const arbitraries = [] as Arbitrary.Gen<unknown>[]
  //const keys = [] as string[]

  for (const p of props) {
    //propsObj[p.Api.fields[key].value] = p
    guards.push(S.Guard.for(p))
    parsers.push(S.Parser.for(p))
    encoders.push(S.Encoder.for(p))
    constructors.push(S.Constructor.for(p))
    //   ofs.push((_: any) =>
    //     constructors[p.Api.fields[key].value](
    //       Object.assign({ [key]: p.Api.fields[key].value }, _)
    //     ))
    arbitraries.push(S.Arbitrary.for(p))
    //keys.push(p.Api.fields[key].value)
  }

  const guard = (
    u: unknown
  ): u is {
    [K in keyof Props]: Props[K] extends S.SchemaAny ? S.ParsedShapeOf<Props[K]> : never
  }[number] => {
    return guards.some((g) => g(u))
  }

  return pipe(
    S.identity(guard),
    S.arbitrary(
      (_) =>
        _.oneof(...arbitraries.map((f) => f(_))) as Arbitrary.Arbitrary<
          {
            [K in keyof Props]: Props[K] extends S.SchemaAny
              ? S.ParsedShapeOf<Props[K]>
              : never
          }[number]
        >
    ),
    S.encoder((_) => {
      for (const i in guards) {
        if (guards[i](_)) {
          return encoders[i](_)
        }
      }
    }),
    S.parser((u: unknown) => {
      for (const i in parsers) {
        const p = parsers[i]
        //const tag = i.toString()
        const result = p(u)
        if (result.effect._tag === "Left") {
          continue
          // return Th.fail(
          //   S.compositionE(
          //     Chunk.single(
          //       S.nextE(
          //         S.unionE(
          //           Chunk.single(
          //             S.memberE(
          //               tag,
          //               result.effect.left
          //             )
          //             /*
          //             as Props[number] extends S.SchemaAny
          //               ? S.MemberE<
          //                   S.ParsedShapeOf<Props[number]>[Key],
          //                   S.ParserErrorOf<Props[number]>
          //                 >
          //               : never*/
          //           )
          //         )
          //       )
          //     )
          //   )
          // )
        } else {
          const warnings = result.effect.right.get(1)
          if (warnings._tag === "Some") {
            continue
            //   return Th.warn(
            //     result.effect.right.get(0) as any,
            //     S.compositionE(
            //       Chunk.single(
            //         S.nextE(
            //           S.unionE(
            //             Chunk.single(
            //               S.memberE(
            //                 tag,
            //                 warnings.value
            //               ) as Props[number] extends S.SchemaAny
            //                 ? S.MemberE<
            //                     S.ParsedShapeOf<Props[number]>[Key],
            //                     S.ParserErrorOf<Props[number]>
            //                   >
            //                 : never
            //             )
            //           )
            //         )
            //       )
            //     )
            //   )
          }

          return Th.succeed(result.effect.right.get(0) as any)
        }
      }
      return Th.fail(
        // TODO
        S.compositionE(Chunk.single(S.prevE(S.leafE(S.extractKeyE("", [], u)))))
      )
    }),
    S.constructor(
      (
        u: {
          [K in keyof Props]: Props[K] extends S.SchemaAny
            ? S.ConstructorInputOf<Props[K]>
            : never
        }[number]
      ): Th.These<
        UnionE<
          {
            [K in keyof Props]: Props[K] extends S.SchemaAny
              ? S.MemberE<K, S.ConstructorErrorOf<Props[K]>>
              : never
          }[number]
        >,
        {
          [K in keyof Props]: Props[K] extends S.SchemaAny
            ? S.ConstructedShapeOf<Props[K]>
            : never
        }[number]
      > => {
        for (const i in parsers) {
          const p = parsers[i]
          //const tag = i.toString()
          const result = p(u)
          if (result.effect._tag === "Left") {
            continue
          } else {
            const warnings = result.effect.right.get(1)
            if (warnings._tag === "Some") {
              continue
            }
            return Th.succeed(result.effect.right.get(0) as any)
          }
        }
        // TODO
        return Th.fail(S.unionE(Chunk.single(S.memberE("", "not matching any")))) as any
        // Th.fail(
        //   // TODO
        //   S.unionE(Chunk.single(S.prevE(S.leafE(S.extractKeyE("", [], u)))))
        // )
        //   const tag = u[key as string]

        //   const memberConstructor = constructors[tag] as Constructor.Constructor<
        //     unknown,
        //     unknown,
        //     unknown
        //   >

        //   const result = memberConstructor(u)

        //   if (result.effect._tag === "Left") {
        //     return Th.fail(
        //       S.unionE(
        //         Chunk.single(
        //           S.memberE(
        //             tag,
        //             result.effect.left
        //           ) as Props[number] extends S.SchemaAny
        //             ? S.MemberE<
        //                 S.ConstructedShapeOf<Props[number]>[Key],
        //                 S.ConstructorErrorOf<Props[number]>
        //               >
        //             : never
        //         )
        //       )
        //     )
        //   }

        //   const warnings = result.effect.right.get(1)

        //   if (warnings._tag === "Some") {
        //     return Th.warn(
        //       result.effect.right.get(0) as any,
        //       S.unionE(
        //         Chunk.single(
        //           S.memberE(tag, warnings.value) as Props[number] extends S.SchemaAny
        //             ? S.MemberE<
        //                 S.ConstructedShapeOf<Props[number]>[Key],
        //                 S.ConstructorErrorOf<Props[number]>
        //               >
        //             : never
        //         )
        //       )
        //     )
        //   }

        //   return Th.succeed(result.effect.right.get(0) as any)
      }
    ),
    //   S.mapApi(
    //     (_) =>
    //       ({
    //         of: ofs,
    //         matchS: (match) => (a) => match[a[key]](a),
    //         matchW: (match) => (a) => match[a[key]](a),
    //       } as UnionApi<Props>)
    //   ),
    S.identified(unionIdentifier, { props }),
    S.mapApi(() => ({}))
  ) as any
}
