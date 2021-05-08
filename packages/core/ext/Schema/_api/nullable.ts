import { pipe } from "../../Function"
import * as O from "../../Option"
import * as S from "../_schema"
import { Guard, Arbitrary, These as Th, Constructor, Parser, Encoder } from "../vendor"

export const nullableIdentifier = Symbol.for("@effect-ts/schema/ids/nullable")

export function nullable<Self extends S.SchemaAny>(
  self: Self
): S.Schema<
  S.ParserInputOf<Self> | null,
  // TODO: and Option wrapper error too
  S.LeafE<ReturnType<Self["_ConstructorError"]>>, //S.CollectionE<S.OptionalIndexE<number, ReturnType<Self["_ParserError"]>>>,
  O.Option<ReturnType<Self["_ParsedShape"]>>,
  S.ConstructorInputOf<Self> | null,
  S.LeafE<ReturnType<Self["_ConstructorError"]>>, //S.CollectionE<S.OptionalIndexE<number, ReturnType<Self["_ConstructorError"]>>>,
  O.Option<ReturnType<Self["_ConstructedShape"]>>,
  S.EncodedOf<Self> | null,
  S.ApiOf<Self>
> {
  const guard = Guard.for(self)
  const arb = Arbitrary.for(self)
  const create = Constructor.for(self)
  const parse = Parser.for(self)
  const refinement = (u: unknown): u is O.Option<S.ParsedShapeOf<Self>> =>
    typeof u === "object" &&
    u !== null &&
    ["None", "Some"].indexOf(u["_tag"]) !== -1 &&
    ((u["_tag"] === "Some" && guard(u["value"])) || u["_tag"] === "None")
  const encode = Encoder.for(self)

  return pipe(
    S.identity(refinement),
    S.arbitrary((_) => _.option(arb(_)).map(O.fromNullable)),
    S.parser((i: S.ParserInputOf<Self> | null) => {
      return i == null ? Th.succeed(O.none) : Th.map_(parse(i), O.some)
    }),
    S.constructor((i: S.ConstructorInputOf<Self> | null) => {
      return i == null ? Th.succeed(O.none) : Th.map_(create(i), O.fromNullable)
    }),
    //TODO: find out whats going wrong, as the encoded types have tag in them
    // but only inside arrays :)
    S.encoder((_) => O.map_(_, encode)["|>"](O.toNullable) as S.EncodedOf<Self> | null),
    S.mapApi(() => self.Api as S.ApiOf<Self>),
    S.identified(nullableIdentifier, { self })
  )
}
