/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Erase } from "@effect-ts-demo/core/ext/Effect"
import * as Lens from "@effect-ts/monocle/Lens"
import { unsafe } from "@effect-ts/schema/_api/condemn"

import { Compute } from "../Compute"

import * as S from "./_schema"
import { AnyError, fromFields, schemaField, SchemaForModel } from "./_schema"

export const GET = "GET"
export type GET = typeof GET

export const POST = "POST"
export type POST = typeof POST

export const PUT = "PUT"
export type PUT = typeof PUT

export const PATCH = "PATCH"
export type PATCH = typeof PATCH

export const DELETE = "DELETE"
export type DELETE = typeof DELETE

export const UPDATE = "UPDATE"
export type UPDATE = typeof UPDATE

export const OPTIONS = "OPTIONS"
export type OPTIONS = typeof OPTIONS

export const HEAD = "HEAD"
export type HEAD = typeof HEAD

export const TRACE = "TRACE"
export type TRACE = typeof TRACE

export type ReadMethods = GET
export type WriteMethods = POST | PUT | PATCH | DELETE

export type Methods = ReadMethods | WriteMethods
export const requestBrand = Symbol()

export type StringRecord = Record<string, string>

export type AnyRecord = Record<string, any>

export type AnyRecordSchema = S.Schema<
  unknown,
  AnyError,
  any,
  any,
  AnyError,
  AnyRecord,
  any
>
export type StringRecordSchema = S.Schema<
  unknown,
  AnyError,
  any,
  any,
  AnyError,
  StringRecord,
  any
>

// Actually GET + DELETE
export interface ReadRequest<
  M,
  Path extends StringRecordSchema | undefined,
  Query extends StringRecordSchema | undefined,
  Headers extends StringRecordSchema | undefined,
  Self extends S.SchemaAny
> extends Model<M, Self> {
  Body: undefined
  Path: Path
  Query: Query
  Headers: Headers
  path: string
  method: ReadMethods
}

// Actually all other methods except GET + DELETE
export interface WriteRequest<
  M,
  Path extends StringRecordSchema | undefined,
  Body extends AnyRecordSchema | undefined,
  Query extends StringRecordSchema | undefined,
  Headers extends StringRecordSchema | undefined,
  Self extends S.SchemaAny
> extends Model<M, Self> {
  Path: Path
  Body: Body
  Query: Query
  Headers: Headers
  path: string
  method: WriteMethods
}

// Not inheriting from Schemed because we don't want `copy`
// passing SelfM down to Model2 so we only compute it once.
export interface Model<M, Self extends S.SchemaAny>
  extends Model2<M, Self, SchemaForModel<M, Self>> {}
export interface Model2<M, Self extends S.SchemaAny, SelfM extends S.SchemaAny>
  extends S.Schema<
    S.ParserInputOf<Self>,
    S.NamedE<string, S.ParserErrorOf<Self>>,
    M,
    S.ConstructorInputOf<Self>,
    S.NamedE<string, S.ConstructorErrorOf<Self>>,
    S.EncodedOf<Self>,
    S.ApiOf<Self>
  > {
  new (_: Compute<S.ConstructorInputOf<Self>>): Compute<S.ParsedShapeOf<Self>>
  [S.schemaField]: SelfM
  readonly Model: SelfM // added
  readonly lens: Lens.Lens<M, M> // added

  readonly Parser: S.ParserFor<SelfM>
  readonly Constructor: S.ConstructorFor<SelfM>
  readonly Encoder: S.EncoderFor<SelfM>
  readonly Guard: S.GuardFor<SelfM>
  readonly Arbitrary: S.ArbitraryFor<SelfM>
}

type OrAny<T> = T extends S.SchemaAny ? T : S.SchemaAny
//type OrUndefined<T> = T extends S.SchemaAny ? undefined : S.SchemaAny

// TODO: Somehow ensure that Self and M are related..
//type Ensure<M, Self extends S.SchemaAny> = M extends S.ParsedShapeOf<Self> ? M : never
// TODO: intersect with Query
export function ReadRequest<M>() {
  function a<Headers extends StringRecordSchema>(
    method: ReadMethods,
    path: string,
    _: {
      headers?: Headers
    }
  ): ReadRequest<M, undefined, undefined, Headers, S.SchemaAny>
  function a<Path extends StringRecordSchema, Headers extends StringRecordSchema>(
    method: ReadMethods,
    path: string,
    _: {
      headers?: Headers
      path: Path
    }
  ): ReadRequest<M, Path, undefined, Headers, Path>
  function a<Query extends StringRecordSchema, Headers extends StringRecordSchema>(
    method: ReadMethods,
    path: string,
    {
      headers,
      query,
    }: {
      headers?: Headers
      query: Query
    }
  ): ReadRequest<M, undefined, Query, Headers, Query>
  function a<
    QueryParserError extends S.SchemaError<any>,
    QueryParsedShape extends AnyRecord,
    QueryConstructorInput,
    QueryConstructorError extends S.SchemaError<any>,
    QueryEncoded extends StringRecord,
    QueryApi,
    PathParserError extends S.SchemaError<any>,
    PathParsedShape extends AnyRecord,
    PathConstructorInput,
    PathConstructorError extends S.SchemaError<any>,
    PathEncoded extends StringRecord,
    PathApi,
    Headers extends StringRecordSchema
  >(
    method: ReadMethods,
    path: string,
    _: {
      headers?: Headers
      path: S.Schema<
        unknown,
        PathParserError,
        PathParsedShape,
        PathConstructorInput,
        PathConstructorError,
        PathEncoded,
        PathApi
      >
      query: S.Schema<
        unknown,
        QueryParserError,
        QueryParsedShape,
        QueryConstructorInput,
        QueryConstructorError,
        QueryEncoded,
        QueryApi
      >
    }
  ): ReadRequest<
    M,
    S.Schema<
      unknown,
      PathParserError,
      PathParsedShape,
      PathConstructorInput,
      PathConstructorError,
      PathEncoded,
      PathApi
    >,
    S.Schema<
      unknown,
      QueryParserError,
      QueryParsedShape,
      QueryConstructorInput,
      QueryConstructorError,
      QueryEncoded,
      QueryApi
    >,
    Headers,
    S.Schema<
      unknown,
      S.IntersectionE<S.MemberE<0, QueryParserError> | S.MemberE<1, PathParserError>>,
      QueryParsedShape & PathParsedShape,
      QueryConstructorInput & PathConstructorInput,
      S.IntersectionE<
        S.MemberE<0, QueryConstructorError> | S.MemberE<1, PathConstructorError>
      >,
      QueryEncoded & PathEncoded,
      {}
    >
  >
  function a<
    Path extends StringRecordSchema,
    Query extends StringRecordSchema,
    Headers extends StringRecordSchema
  >(
    method: ReadMethods,
    path: string,
    _: {
      headers?: Headers
      path?: Path
      query?: Query
    }
  ): ReadRequest<
    M,
    Path,
    Query,
    Headers,
    OrAny<Erase<typeof _.path & typeof _.query, S.SchemaAny>>
  > {
    const self: S.SchemaAny =
      _.path && _.query
        ? _.path["|>"](S.intersect(_.query))
        : _.path
        ? _.path
        : _.query
        ? _.query
        : S.props({})
    type Self = Path
    const of_ = S.Constructor.for(self)["|>"](unsafe)
    // @ts-expect-error the following is correct
    return class {
      static [schemaField] = self
      static get Model() {
        return this[schemaField]
      }
      static [requestBrand] = requestBrand

      static path = path
      static method = method

      static Path = _.path
      static Query = _.query
      static Headers = _.headers
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
          // @ts-expect-error The following is allowed
          this[k] = fields[k]
        }
      }
    }
  }
  return a
}

export function WriteRequest<M>() {
  function a<Headers extends StringRecordSchema>(
    method: WriteMethods,
    path: string,
    _: {
      headers?: Headers
    }
  ): WriteRequest<M, undefined, undefined, undefined, Headers, S.SchemaAny>
  function a<Path extends StringRecordSchema, Headers extends StringRecordSchema>(
    method: WriteMethods,
    path: string,
    _: {
      headers?: Headers
      path: Path
    }
  ): WriteRequest<M, Path, undefined, undefined, Headers, Path>
  function a<Body extends AnyRecordSchema, Headers extends StringRecordSchema>(
    method: WriteMethods,
    path: string,
    _: {
      headers?: Headers
      body: Body
    }
  ): WriteRequest<M, undefined, Body, undefined, Headers, Body>
  function a<
    BodyParserError extends S.SchemaError<any>,
    BodyParsedShape extends AnyRecord,
    BodyConstructorInput,
    BodyConstructorError extends S.SchemaError<any>,
    BodyEncoded extends AnyRecord,
    BodyApi,
    QueryParserError extends S.SchemaError<any>,
    QueryParsedShape extends AnyRecord,
    QueryConstructorInput,
    QueryConstructorError extends S.SchemaError<any>,
    QueryEncoded extends StringRecord,
    QueryApi,
    Headers extends StringRecordSchema
  >(
    method: WriteMethods,
    path: string,
    _: {
      headers?: Headers
      body: S.Schema<
        unknown,
        BodyParserError,
        BodyParsedShape,
        BodyConstructorInput,
        BodyConstructorError,
        BodyEncoded,
        BodyApi
      >
      query: S.Schema<
        unknown,
        QueryParserError,
        QueryParsedShape,
        QueryConstructorInput,
        QueryConstructorError,
        QueryEncoded,
        QueryApi
      >
    }
  ): WriteRequest<
    M,
    undefined,
    S.Schema<
      unknown,
      BodyParserError,
      BodyParsedShape,
      BodyConstructorInput,
      BodyConstructorError,
      BodyEncoded,
      BodyApi
    >,
    S.Schema<
      unknown,
      QueryParserError,
      QueryParsedShape,
      QueryConstructorInput,
      QueryConstructorError,
      QueryEncoded,
      QueryApi
    >,
    Headers,
    S.Schema<
      unknown,
      S.IntersectionE<S.MemberE<0, BodyParserError> | S.MemberE<1, QueryParserError>>,
      BodyParsedShape & QueryParsedShape,
      BodyConstructorInput & QueryConstructorInput,
      S.IntersectionE<
        S.MemberE<0, BodyConstructorError> | S.MemberE<1, QueryConstructorError>
      >,
      BodyEncoded & QueryEncoded,
      {}
    >
  >
  function a<
    QueryParserError extends S.SchemaError<any>,
    QueryParsedShape extends AnyRecord,
    QueryConstructorInput,
    QueryConstructorError extends S.SchemaError<any>,
    QueryEncoded extends StringRecord,
    QueryApi,
    PathParserError extends S.SchemaError<any>,
    PathParsedShape extends AnyRecord,
    PathConstructorInput,
    PathConstructorError extends S.SchemaError<any>,
    PathEncoded extends StringRecord,
    PathApi,
    Headers extends StringRecordSchema
  >(
    method: WriteMethods,
    path: string,
    _: {
      headers?: Headers
      path: S.Schema<
        unknown,
        PathParserError,
        PathParsedShape,
        PathConstructorInput,
        PathConstructorError,
        PathEncoded,
        PathApi
      >
      query: S.Schema<
        unknown,
        QueryParserError,
        QueryParsedShape,
        QueryConstructorInput,
        QueryConstructorError,
        QueryEncoded,
        QueryApi
      >
    }
  ): WriteRequest<
    M,
    S.Schema<
      unknown,
      PathParserError,
      PathParsedShape,
      PathConstructorInput,
      PathConstructorError,
      PathEncoded,
      PathApi
    >,
    S.Schema<
      unknown,
      QueryParserError,
      QueryParsedShape,
      QueryConstructorInput,
      QueryConstructorError,
      QueryEncoded,
      QueryApi
    >,
    undefined,
    Headers,
    S.Schema<
      unknown,
      S.IntersectionE<S.MemberE<0, QueryParserError> | S.MemberE<1, PathParserError>>,
      QueryParsedShape & PathParsedShape,
      QueryConstructorInput & PathConstructorInput,
      S.IntersectionE<
        S.MemberE<0, QueryConstructorError> | S.MemberE<1, PathConstructorError>
      >,
      QueryEncoded & PathEncoded,
      {}
    >
  >
  function a<
    BodyParserError extends S.SchemaError<any>,
    BodyParsedShape extends AnyRecord,
    BodyConstructorInput,
    BodyConstructorError extends S.SchemaError<any>,
    BodyEncoded extends AnyRecord,
    BodyApi,
    PathParserError extends S.SchemaError<any>,
    PathParsedShape extends AnyRecord,
    PathConstructorInput,
    PathConstructorError extends S.SchemaError<any>,
    PathEncoded extends StringRecord,
    PathApi,
    Headers extends StringRecordSchema
  >(
    method: WriteMethods,
    path: string,
    _: {
      headers?: Headers
      path: S.Schema<
        unknown,
        PathParserError,
        PathParsedShape,
        PathConstructorInput,
        PathConstructorError,
        PathEncoded,
        PathApi
      >
      body: S.Schema<
        unknown,
        BodyParserError,
        BodyParsedShape,
        BodyConstructorInput,
        BodyConstructorError,
        BodyEncoded,
        BodyApi
      >
    }
  ): WriteRequest<
    M,
    S.Schema<
      unknown,
      PathParserError,
      PathParsedShape,
      PathConstructorInput,
      PathConstructorError,
      PathEncoded,
      PathApi
    >,
    S.Schema<
      unknown,
      BodyParserError,
      BodyParsedShape,
      BodyConstructorInput,
      BodyConstructorError,
      BodyEncoded,
      BodyApi
    >,
    undefined,
    Headers,
    S.Schema<
      unknown,
      S.IntersectionE<S.MemberE<0, BodyParserError> | S.MemberE<1, PathParserError>>,
      BodyParsedShape & PathParsedShape,
      BodyConstructorInput & PathConstructorInput,
      S.IntersectionE<
        S.MemberE<0, BodyConstructorError> | S.MemberE<1, PathConstructorError>
      >,
      BodyEncoded & PathEncoded,
      {}
    >
  >
  function a<
    BodyParserError extends S.SchemaError<any>,
    BodyParsedShape extends AnyRecord,
    BodyConstructorInput,
    BodyConstructorError extends S.SchemaError<any>,
    BodyEncoded extends AnyRecord,
    BodyApi,
    PathParserError extends S.SchemaError<any>,
    PathParsedShape extends AnyRecord,
    PathConstructorInput,
    PathConstructorError extends S.SchemaError<any>,
    PathEncoded extends StringRecord,
    PathApi,
    QueryParserError extends S.SchemaError<any>,
    QueryParsedShape extends AnyRecord,
    QueryConstructorInput,
    QueryConstructorError extends S.SchemaError<any>,
    QueryEncoded extends StringRecord,
    QueryApi,
    Headers extends StringRecordSchema
  >(
    method: WriteMethods,
    path: string,
    _: {
      headers?: Headers
      path: S.Schema<
        unknown,
        PathParserError,
        PathParsedShape,
        PathConstructorInput,
        PathConstructorError,
        PathEncoded,
        PathApi
      >
      body: S.Schema<
        unknown,
        BodyParserError,
        BodyParsedShape,
        BodyConstructorInput,
        BodyConstructorError,
        BodyEncoded,
        BodyApi
      >
      query: S.Schema<
        unknown,
        QueryParserError,
        QueryParsedShape,
        QueryConstructorInput,
        QueryConstructorError,
        QueryEncoded,
        QueryApi
      >
    }
  ): WriteRequest<
    M,
    S.Schema<
      unknown,
      PathParserError,
      PathParsedShape,
      PathConstructorInput,
      PathConstructorError,
      PathEncoded,
      PathApi
    >,
    S.Schema<
      unknown,
      BodyParserError,
      BodyParsedShape,
      BodyConstructorInput,
      BodyConstructorError,
      BodyEncoded,
      BodyApi
    >,
    S.Schema<
      unknown,
      QueryParserError,
      QueryParsedShape,
      QueryConstructorInput,
      QueryConstructorError,
      QueryEncoded,
      QueryApi
    >,
    Headers,
    S.Schema<
      unknown,
      S.IntersectionE<
        | S.MemberE<0, BodyParserError>
        | S.MemberE<1, PathParserError>
        | S.MemberE<2, QueryParserError>
      >,
      BodyParsedShape & PathParsedShape & QueryParsedShape,
      BodyConstructorInput & PathConstructorInput & QueryConstructorInput,
      S.IntersectionE<
        | S.MemberE<0, BodyConstructorError>
        | S.MemberE<1, PathConstructorError>
        | S.MemberE<2, QueryConstructorError>
      >,
      BodyEncoded & PathEncoded & QueryEncoded,
      {}
    >
  >
  function a<
    Path extends StringRecordSchema,
    Body extends AnyRecordSchema,
    Query extends StringRecordSchema,
    Headers extends StringRecordSchema
  >(
    method: WriteMethods,
    path: string,
    _: {
      headers?: Headers
      path?: Path
      body?: Body
      query?: Query
    }
  ): WriteRequest<
    M,
    Path,
    Body,
    Query,
    Headers,
    OrAny<Erase<typeof _.path & typeof _.body & typeof _.query, S.SchemaAny>>
  > {
    const s =
      _.path && _.body
        ? _.path["|>"](S.intersect(_.body))
        : _.path
        ? _.path
        : _.body
        ? _.body
        : S.props({})
    const self: S.SchemaAny = _.query ? s["|>"](S.intersect(_.query)) : s
    type Self = Path
    const of_ = S.Constructor.for(self)["|>"](unsafe)
    // @ts-expect-error the following is correct
    return class {
      static [schemaField] = self
      static get Model() {
        return this[schemaField]
      }
      static [requestBrand] = requestBrand

      static Path = _.path
      static Body = _.body
      static Query = _.query
      static Headers = _.headers
      static path = path
      static method = method
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
          // @ts-expect-error The following is allowed
          this[k] = fields[k]
        }
      }
    }
  }
  return a
}

export function Model<M>() {
  return <Self extends S.SchemaAny>(self: Self): Model<M, Self> => {
    const of_ = S.Constructor.for(self)["|>"](unsafe)
    // @ts-expect-error the following is correct
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
          // @ts-expect-error The following is allowed
          this[k] = fields[k]
        }
      }
    }
  }
}
export type ReqRes<E, A> = S.Schema<
  unknown, //ParserInput,
  any, // S.AnyError //ParserError,
  A, //ParsedShape,
  any, //ConstructorInput,
  any, //ConstructorError,
  E, //Encoded,
  any //Api
>
export type ReqResSchemed<E, A> = {
  new (...args: any[]): any
  Encoder: S.Encoder.Encoder<A, E>
  Model: ReqRes<E, A>
}

export type RequestSchemed<E, A> = ReqResSchemed<E, A> & {
  method: Methods
  path: string
}

export function extractSchema<ResE, ResA>(
  Res_: ReqRes<ResE, ResA> | ReqResSchemed<ResE, ResA>
) {
  const res_ = Res_ as any
  const Res = res_[schemaField]
    ? (res_.Model as ReqRes<ResE, ResA>)
    : (res_ as ReqRes<ResE, ResA>)
  return Res
}
