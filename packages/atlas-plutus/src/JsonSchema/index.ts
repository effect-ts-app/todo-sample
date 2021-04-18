// CREDITS:
// https://github.com/sledorze/morphic-ts/blob/master/packages/morphic-json-schema-interpreters/src/json-schema/json-schema.ts

/* eslint-disable no-prototype-builtins */
import type * as A from "@effect-ts/core/Classic/Array"
import { pipe } from "@effect-ts/core/Function"
import * as Lens from "@effect-ts/monocle/Lens"
import * as Prism from "@effect-ts/monocle/Prism"

export interface DescriptionSchema {
  description?: string
  title?: string
}

export interface StringSchema extends DescriptionSchema {
  type: "string"
  minLength?: number
  maxLength?: number
  format?:
    | "date-time"
    | "date"
    | "password"
    | "byte"
    | "binary"
    | "bigint"
    | "uuid"
    | "email"
  pattern?: string
}

export const StringSchema = (x?: {
  minLength?: number
  maxLength?: number
  format?:
    | "date-time"
    | "date"
    | "password"
    | "byte"
    | "binary"
    | "bigint"
    | "uuid"
    | "email"
  pattern?: string
  description?: string
}): StringSchema => ({ type: "string", ...(x === undefined ? {} : x) })

export interface EnumSchema extends DescriptionSchema {
  type: "string"
  enum: A.Array<string>
}

export interface NumberEnumSchema extends DescriptionSchema {
  type: "number"
  enum: A.Array<number>
}

export const EnumSchema = (p: {
  enum: A.Array<string>
  description?: string
}): EnumSchema => ({
  type: "string",
  ...p
})

export const isEnumSchema = (x: JSONSchema): x is EnumSchema =>
  "type" in x && x.type === "string" && Array.isArray((x as EnumSchema).enum)

export interface NumberSchema extends DescriptionSchema {
  type: "number"
  multipleOf?: number
  minimum?: number
  exclusiveMinimum?: boolean
  maximum?: number
  exclusiveMaximum?: boolean
}

export const NumberSchema = (x?: {
  multipleOf?: number
  minimum?: number
  exclusiveMinimum?: boolean
  maximum?: number
  exclusiveMaximum?: boolean
  description?: string
}): NumberSchema => ({ type: "number", ...(x === undefined ? {} : x) })

export interface BooleanSchema extends DescriptionSchema {
  type: "boolean"
}

export const BooleanSchema = (p: { description?: string }) => ({
  type: "boolean",
  ...p
})

export interface ArraySchema extends DescriptionSchema {
  type: "array"
  items: SubSchema | A.Array<SubSchema>
}

export const ArraySchema = (p: {
  items: SubSchema | A.Array<SubSchema>
  description?: string
  minItems?: number
  maxItems?: number
}) => ({
  type: "array" as const,
  ...p
})

export interface Ref {
  $ref: string
}

export const Ref = ($ref: string): Ref => ({ $ref })

export interface ObjectSchema extends DescriptionSchema {
  type?: "object"
  description?: string
  required?: A.Array<string>
  properties?: Record<string, SubSchema>
  additionalProperties?: SubSchema
}

export const objectSchemaOnRequired = pipe(
  Lens.id<ObjectSchema>(),
  Lens.prop("required")
)

export const ObjectSchema = (x: {
  description?: string
  required?: A.Array<string>
  properties?: Record<string, SubSchema>
}): ObjectSchema => ({ type: "object" as const, ...x })

export const isObjectSchema = (x: SubSchema): x is ObjectSchema =>
  "type" in x && x.type === "object"

export const jsonToObjectSchemaPrism = Prism.fromPredicate(isObjectSchema)

export type SubSchema = JSONSchema | Ref

export const SubSchema = (x: SubSchema) => x

export interface Anything {}

export const Anything: Anything = {}

export interface OneOfSchema extends DescriptionSchema {
  oneOf: A.Array<JSONSchema | SubSchema>
  discriminator?: {
    propertyName: string
  }
}

export interface AllOfSchema extends DescriptionSchema {
  allOf: A.Array<JSONSchema | SubSchema>
  discriminator?: {
    propertyName: string
  }
}

export type JSONSchema =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | ArraySchema
  | ObjectSchema
  | OneOfSchema
  | AllOfSchema
  | (EnumSchema & { $schema?: string })
  | (NumberEnumSchema & { $schema?: number })

export const isTypeObject = (schema: JSONSchema | SubSchema): schema is ObjectSchema =>
  !isTypeRef(schema) &&
  (("type" in schema && schema.type === "object") ||
    schema.hasOwnProperty("properties"))

export const isTypeArray = (schema: JSONSchema | SubSchema): schema is ArraySchema =>
  !isTypeRef(schema) &&
  "type" in schema &&
  schema.type !== undefined &&
  schema.type === "array"

export const isTypeRef = (schema: JSONSchema | SubSchema): schema is Ref =>
  schema.hasOwnProperty("$ref")

export const isnotTypeRef = (schema: JSONSchema | SubSchema): schema is JSONSchema =>
  !schema.hasOwnProperty("$ref")

export const isNotPrimitive = (schema: JSONSchema | SubSchema) =>
  isTypeObject(schema) || isTypeArray(schema) || isTypeRef(schema)

export const isStringSchema = (schema: JSONSchema): schema is StringSchema =>
  "type" in schema && schema.type === "string"

export const isNumberSchema = (schema: JSONSchema): schema is NumberSchema =>
  "type" in schema && schema.type === "number"

export const isBooleanSchema = (schema: JSONSchema): schema is BooleanSchema =>
  "type" in schema && schema.type === "boolean"

export const isPrimitive = (
  schema: JSONSchema | SubSchema
): schema is StringSchema | NumberSchema | BooleanSchema =>
  !isTypeRef(schema) &&
  (isStringSchema(schema) || isNumberSchema(schema) || isBooleanSchema(schema))

export const isObjectOrRef = (
  schema: JSONSchema | SubSchema
): schema is Ref | ObjectSchema => isTypeRef(schema) || isObjectSchema(schema)

export const isNamed = (schema: JSONSchema | SubSchema) =>
  !isTypeRef(schema) && "type" in schema && schema.description !== undefined
