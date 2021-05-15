// tracing: off
import {
  AllOfSchema,
  ArraySchema,
  BooleanSchema,
  EnumSchema,
  JSONSchema,
  NumberSchema,
  ObjectSchema,
  OneOfSchema,
  referenced,
  StringSchema,
} from "@atlas-ts/plutus"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"
import {
  arrayIdentifier,
  chunkIdentifier,
  dateIdentifier,
  fromChunkIdentifier,
  fromStringIdentifier,
  intIdentifier,
  literalIdentifier,
  nonEmptyStringFromStringIdentifier,
  numberIdentifier,
  positiveIntFromNumber,
  positiveIntIdentifier,
  propertiesIdentifier,
  stringIdentifier,
} from "@effect-ts/schema"

import { constrainedStringIdentifier } from "../../_api"
import * as S from "../_schema"
import {
  boolIdentifier,
  nullableIdentifier,
  UUIDFromStringIdentifier,
  hasContinuation,
  intersectIdentifier,
  SchemaContinuationSymbol,
  unionIdentifier,
} from "../_schema"

export type Gen<T> = T.UIO<JSONSchema>

export const interpreters: ((schema: S.SchemaAny) => O.Option<Gen<unknown>>)[] = [
  O.partial((_miss) => (schema: S.SchemaAny): Gen<unknown> => {
    if (schema instanceof S.SchemaOpenApi) {
      const cfg = schema.jsonSchema()
      return processId(schema, cfg)
    }

    // if (schema instanceof S.SchemaRecur) {
    //   if (interpreterCache.has(schema)) {
    //     return interpreterCache.get(schema)
    //   }
    //   const parser = () => {
    //     if (interpretedCache.has(schema)) {
    //       return interpretedCache.get(schema)
    //     }
    //     const e = for_(schema.self(schema))()
    //     interpretedCache.set(schema, e)
    //     return e
    //   }
    //   interpreterCache.set(schema, parser)
    //   return parser
    // }

    return processId(schema)

    //return miss()
  }),
]

function processId(schema: S.SchemaAny, meta = {}) {
  if (!schema) {
    throw new Error("schema undefined")
  }
  return T.gen(function* ($) {
    if (meta) {
      //console.log(meta, schema)
    }
    //   if (schema instanceof S.SchemaPipe) {
    //     return processId(schema.that, meta)
    //   }
    //   if (schema instanceof S.SchemaConstructor) {
    //     return processId(schema.self, meta)
    //   }
    if (schema instanceof S.SchemaOpenApi) {
      const cfg = schema.jsonSchema()
      meta = { ...meta, ...cfg }
    }
    if (schema instanceof S.SchemaNamed) {
      return yield* $(processId(schema.self, { title: schema.name }))
    }

    switch (schema.annotation) {
      case intersectIdentifier: {
        const { openapiRef, ...rest } = meta
        const ref = openapiRef || rest.title
        const s = new AllOfSchema({
          ...rest,
          allOf: [
            yield* $(processId(schema.meta.self)),
            yield* $(processId(schema.meta.that)),
          ],
        })
        // If this is a named intersection, we assume that merging the intersected types
        // is desired. Lets make it configurable if someone needs it :)
        return yield* $(referenced({ openapiRef: ref })(T.succeed(ref ? merge(s) : s)))
      }
      case unionIdentifier: {
        return new OneOfSchema({
          ...meta,
          oneOf: yield* $(
            T.collectAll(
              Object.keys(schema.meta.props).map((x) => processId(schema.meta.props[x]))
            )
          ),
          discriminator: schema.meta.tag["|>"](
            O.map(({ key }) => ({
              propertyName: key, // TODO
            }))
          )["|>"](O.toUndefined),
        })
      }
      case stringIdentifier:
        return new StringSchema()
      case constrainedStringIdentifier:
        return new StringSchema({
          minLength: schema.meta.minLength,
          maxLength: schema.meta.maxLength,
        })

      case literalIdentifier:
        return new EnumSchema({ enum: schema.meta.literals })

      case fromStringIdentifier:
        return new StringSchema()
      case UUIDFromStringIdentifier:
        return new StringSchema({ format: "uuid" })
      case dateIdentifier:
        return new StringSchema({ format: "date-time" })
      case nonEmptyStringFromStringIdentifier:
        return new StringSchema({ minLength: 1 })
      case numberIdentifier:
        return new NumberSchema()
      case intIdentifier:
        return new NumberSchema()
      case positiveIntIdentifier:
        return new NumberSchema({ minimum: 0 })
      case positiveIntFromNumber:
        return new NumberSchema({ minimum: 0 })
      case boolIdentifier:
        return new BooleanSchema()
      case nullableIdentifier:
        return { ...(yield* $(processId(schema.meta.self))), nullable: true }
      case arrayIdentifier:
        return new ArraySchema({ items: yield* $(processId(schema.meta.self)) })
      case chunkIdentifier:
        return new ArraySchema({ items: yield* $(processId(schema.meta.self)) })
      case fromChunkIdentifier:
        return new ArraySchema({ items: yield* $(processId(schema.meta.self)) })
      case propertiesIdentifier: {
        const properties = {}
        const required = []
        for (const k in schema.meta.props) {
          const p: S.AnyProperty = schema.meta.props[k]
          properties[k] = yield* $(processId(p["_schema"]))
          if (p["_optional"] === "required") {
            required.push(k)
          }
        }
        const { openapiRef, ...rest } = meta
        return yield* $(
          referenced({ openapiRef: openapiRef || rest.title })(
            T.succeed(
              new ObjectSchema({
                ...rest,
                properties,
                required: required.length ? required : undefined,
              })
            )
          )
        )
      }

      default: {
        if (hasContinuation(schema)) {
          return yield* $(processId(schema[SchemaContinuationSymbol], meta))
          // const arb = for_(schema[SchemaContinuationSymbol])
          // cache.set(schema, arb)
          // return arb as Gen<ParsedShape>
        }
        console.log("$$$ miss", schema)
      }
    }
  })
}

function merge(schema) {
  let b = schema as ObjectSchema // TODO: allOfSchema.
  function recurseAllOf(allOf: AllOfSchema["allOf"], nb: any) {
    allOf.forEach((x: any) => {
      const a = x as AllOfSchema
      if (a.allOf) {
        recurseAllOf(a.allOf, nb)
      } else {
        nb.required = (nb.required ?? []).concat(x.required ?? [])
        if (nb.required.length === 0) {
          nb.required = undefined
        }
        nb.properties = { ...nb.properties, ...x.properties }
      }
    })
  }
  const a = b as AllOfSchema
  if (a.allOf) {
    const [{ description: ____, nullable: ___, title: __, type: _____, ...first }] =
      a.allOf
    const nb = {
      title: a.title,
      type: "object",
      description: a.description,
      nullable: a.nullable,
      ...first,
    }
    recurseAllOf(a.allOf.slice(1), nb)
    b = nb as any
  }
  return b
}

const cache = new WeakMap()

function for_<
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  Encoded,
  Api
>(
  schema: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >
): Gen<ParsedShape> {
  if (cache.has(schema)) {
    return cache.get(schema)
  }
  for (const interpreter of interpreters) {
    const _ = interpreter(schema)
    if (_._tag === "Some") {
      cache.set(schema, _.value)
      return _.value as Gen<ParsedShape>
    }
  }
  if (hasContinuation(schema)) {
    const arb = for_(schema[SchemaContinuationSymbol])
    cache.set(schema, arb)
    return arb as Gen<ParsedShape>
  }
  throw new Error(`Missing openapi integration for: ${schema.constructor}`)
}

export { for_ as for }
