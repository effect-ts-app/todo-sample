// tracing: off

import {
  AllOfSchema,
  ArraySchema,
  BooleanSchema,
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
  nonEmptyStringFromStringIdentifier,
  numberIdentifier,
  partialIdentifier,
  positiveIntFromNumber,
  positiveIntIdentifier,
  requiredIdentifier,
  stringIdentifier,
  taggedUnionIdentifier,
} from "@effect-ts/schema"

import * as S from "../_schema"
import {
  boolIdentifier,
  nullableIdentifier,
  UUIDFromStringIdentifier,
  hasContinuation,
  intersectIdentifier,
  SchemaContinuationSymbol,
  structIdentifier,
} from "../_schema"

type JsonSchema<T> = unknown

export type Gen<T> = T.UIO<JsonSchema<T>>

const interpreterCache = new WeakMap()
const interpretedCache = new WeakMap()

export const interpreters: ((schema: S.SchemaAny) => O.Option<Gen<unknown>>)[] = [
  O.partial((miss) => (schema: S.SchemaAny): Gen<unknown> => {
    if (schema instanceof S.SchemaNamed) {
      //console.log("$$$named", schema.name)
      const self = for_(schema.self)
      return (u) => () => self({ title: schema.name, ...u() })
    }
    // TODO: openapi meta; ref
    // what about name, get from named?
    if (schema instanceof S.SchemaOpenApi) {
      const cfg = schema.jsonSchema()
      return processId(schema, cfg)
    }
    //console.log("$$$openapi parser", schema.constructor, schema)
    if (schema instanceof S.SchemaRecursive) {
      if (interpreterCache.has(schema)) {
        return interpreterCache.get(schema)
      }
      const parser = () => {
        if (interpretedCache.has(schema)) {
          return interpretedCache.get(schema)
        }
        const e = for_(schema.self(schema))()
        interpretedCache.set(schema, e)
        return e
      }
      interpreterCache.set(schema, parser)
      return parser
    }
    if (schema instanceof S.SchemaIdentified) {
      // todo; apply and extract ref.
      //const cfg = processId(schema)
      return processId(schema)
    }
    if (schema instanceof S.SchemaIdentity) {
      //console.log("$$$ id", schema)

      return (_) => _ // ??
    }
    if (schema instanceof S.SchemaCompose) {
      return for_(schema.that)
    }

    if (schema instanceof S.SchemaRefinement) {
      return for_(schema.self)
    }

    return miss()
  }),
]

// TODO: add untagged union
function processId(schema, meta = {}) {
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

    switch (schema.identifier) {
      case intersectIdentifier:
        const { openapiRef, ...rest } = meta
        return yield* $(
          referenced({ openapiRef: openapiRef || rest.title })(
            T.succeed(
              new AllOfSchema({
                ...rest,
                allOf: [
                  yield* $(processId(schema.meta.that)),
                  yield* $(processId(schema.meta.self)),
                ],
              })
            )
          )
        )
      case taggedUnionIdentifier:
        return new OneOfSchema({
          ...meta,
          oneOf: yield* $(T.collectAll(schema.meta.props.map(processId))),
          discriminator: {
            propertyName: schema.meta.key,
          },
        })
      case stringIdentifier:
        return new StringSchema()
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
      case structIdentifier: {
        // todo; recursive
        const {
          required: requiredProps = {},
          optional: optionalProps = {},
        } = schema.meta
        const properties = {}
        const required = []
        for (const k in requiredProps) {
          const p = requiredProps[k]
          properties[k] = yield* $(processId(p))
          required.push(k)
        }
        for (const k in optionalProps) {
          const p = optionalProps[k]
          properties[k] = yield* $(processId(p))
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
      case requiredIdentifier: {
        // todo; recursive
        const { props } = schema.meta
        const properties = {}
        const required = []
        for (const k in props) {
          const p = props[k]
          properties[k] = yield* $(processId(p))
          required.push(k)
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
      case partialIdentifier: {
        // todo; recursive
        const { props } = schema.meta
        const properties = {}
        for (const k in props) {
          const p = props[k]
          properties[k] = yield* $(processId(p))
        }

        const { openapiRef, ...rest } = meta
        return yield* $(
          referenced({ openapiRef: openapiRef || rest.title })(
            T.succeed(
              new ObjectSchema({
                ...rest,
                properties,
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
        // console.log("$$$ miss", schema)
      }
    }
  })
}

const cache = new WeakMap()

function for_<
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  ConstructedShape extends ParsedShape,
  Encoded,
  Api
>(
  schema: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    ConstructedShape,
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
