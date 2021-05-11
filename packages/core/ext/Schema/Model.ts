/* eslint-disable @typescript-eslint/no-explicit-any */
import { Erase } from "@effect-ts-demo/core/ext/Effect"
import * as Lens from "@effect-ts/monocle/Lens"
import { unsafe } from "@effect-ts/schema/_api/condemn"

import type { Compute } from "../Compute"

import * as S from "./_schema"
import { fromFields, schemaField } from "./_schema"

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

export type Methods = GET | POST | PUT | PATCH | DELETE | OPTIONS | HEAD | TRACE

export const requestBrand = Symbol()

export type SchemaForModel<M, Self extends S.SchemaAny> = S.Schema<
  S.ParserInputOf<Self>,
  S.ParserErrorOf<Self>,
  M,
  Compute<S.ConstructorInputOf<Self>>,
  S.ConstructorErrorOf<Self>,
  Compute<S.EncodedOf<Self>>,
  S.ApiOf<Self> & S.ApiSelfType<M>
>

export interface ReadRequest<
  M,
  Path extends S.SchemaAny | undefined,
  Query extends S.SchemaAny | undefined,
  Headers extends S.SchemaAny | undefined,
  Self extends S.SchemaAny
> extends Model2<Self, M, SchemaForModel<M, Self>> {
  [schemaField]: Self
  Path: Path
  Query: Query
  Headers: Headers
  path: string
  method: Methods
}

export interface WriteRequest<
  M,
  Path extends S.SchemaAny | undefined,
  Body extends S.SchemaAny | undefined,
  Headers extends S.SchemaAny | undefined,
  Self extends S.SchemaAny
> extends Model2<Self, M, SchemaForModel<M, Self>> {
  [schemaField]: Self
  Path: Path
  Body: Body
  Headers: Headers
  path: string
  method: Methods
}

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

type OrAny<T> = T extends S.SchemaAny ? T : S.SchemaAny
//type OrUndefined<T> = T extends S.SchemaAny ? undefined : S.SchemaAny

// TODO: Somehow ensure that Self and M are related..
//type Ensure<M, Self extends S.SchemaAny> = M extends S.ParsedShapeOf<Self> ? M : never
// TODO: intersect with Query
export function ReadRequest<M>() {
  function a<Headers extends S.SchemaAny>(
    method: Methods,
    path: string,
    {
      headers,
    }: {
      headers?: Headers
    }
  ): ReadRequest<M, undefined, undefined, Headers, S.SchemaAny>
  function a<Path extends S.SchemaAny, Headers extends S.SchemaAny>(
    method: Methods,
    path: string,
    _: {
      headers?: Headers
      path: Path
    }
  ): ReadRequest<M, Path, undefined, Headers, Path>
  function a<Query extends S.SchemaAny, Headers extends S.SchemaAny>(
    method: Methods,
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
    SelfParserError extends S.SchemaError<any>,
    SelfParsedShape extends Record<string, any>,
    SelfConstructorInput,
    SelfConstructorError extends S.SchemaError<any>,
    SelfEncoded extends Record<string, any>,
    SelfApi,
    ThatParserError extends S.SchemaError<any>,
    ThatParsedShape extends Record<string, any>,
    ThatConstructorInput,
    ThatConstructorError extends S.SchemaError<any>,
    ThatEncoded extends Record<string, any>,
    ThatApi,
    Headers extends S.SchemaAny
  >(
    method: Methods,
    path: string,
    _: {
      headers?: Headers
      path: S.Schema<
        unknown,
        ThatParserError,
        ThatParsedShape,
        ThatConstructorInput,
        ThatConstructorError,
        ThatEncoded,
        ThatApi
      >
      query: S.Schema<
        unknown,
        SelfParserError,
        SelfParsedShape,
        SelfConstructorInput,
        SelfConstructorError,
        SelfEncoded,
        SelfApi
      >
    }
  ): ReadRequest<
    M,
    S.Schema<
      unknown,
      ThatParserError,
      ThatParsedShape,
      ThatConstructorInput,
      ThatConstructorError,
      ThatEncoded,
      ThatApi
    >,
    S.Schema<
      unknown,
      SelfParserError,
      SelfParsedShape,
      SelfConstructorInput,
      SelfConstructorError,
      SelfEncoded,
      SelfApi
    >,
    Headers,
    S.Schema<
      unknown,
      S.IntersectionE<S.MemberE<0, SelfParserError> | S.MemberE<1, ThatParserError>>,
      SelfParsedShape & ThatParsedShape,
      SelfConstructorInput & ThatConstructorInput,
      S.IntersectionE<
        S.MemberE<0, SelfConstructorError> | S.MemberE<1, ThatConstructorError>
      >,
      SelfEncoded & ThatEncoded,
      {}
    >
  >
  function a<
    Path extends S.SchemaAny,
    Query extends S.SchemaAny,
    Headers extends S.SchemaAny
  >(
    method: Methods,
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
    const self =
      _.path && _.query
        ? _.path["|>"](S.intersect(_.query))
        : _.path
        ? _.path
        : _.query
        ? _.query
        : S.required({})
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
  function a<Headers extends S.SchemaAny>(
    method: Methods,
    path: string,
    {
      headers,
    }: {
      headers?: Headers
    }
  ): WriteRequest<M, undefined, undefined, Headers, S.SchemaAny>
  function a<Path extends S.SchemaAny, Headers extends S.SchemaAny>(
    method: Methods,
    path: string,
    _: {
      headers?: Headers
      path: Path
    }
  ): WriteRequest<M, Path, undefined, Headers, Path>
  function a<Body extends S.SchemaAny, Headers extends S.SchemaAny>(
    method: Methods,
    path: string,
    _: {
      headers?: Headers
      body: Body
    }
  ): WriteRequest<M, undefined, Body, Headers, Body>
  function a<
    SelfParserError extends S.SchemaError<any>,
    SelfParsedShape extends Record<string, any>,
    SelfConstructorInput,
    SelfConstructorError extends S.SchemaError<any>,
    SelfEncoded extends Record<string, any>,
    SelfApi,
    ThatParserError extends S.SchemaError<any>,
    ThatParsedShape extends Record<string, any>,
    ThatConstructorInput,
    ThatConstructorError extends S.SchemaError<any>,
    ThatEncoded extends Record<string, any>,
    ThatApi,
    Headers extends S.SchemaAny
  >(
    method: Methods,
    path: string,
    _: {
      headers?: Headers
      path: S.Schema<
        unknown,
        ThatParserError,
        ThatParsedShape,
        ThatConstructorInput,
        ThatConstructorError,
        ThatEncoded,
        ThatApi
      >
      body: S.Schema<
        unknown,
        SelfParserError,
        SelfParsedShape,
        SelfConstructorInput,
        SelfConstructorError,
        SelfEncoded,
        SelfApi
      >
    }
  ): WriteRequest<
    M,
    S.Schema<
      unknown,
      ThatParserError,
      ThatParsedShape,
      ThatConstructorInput,
      ThatConstructorError,
      ThatEncoded,
      ThatApi
    >,
    S.Schema<
      unknown,
      SelfParserError,
      SelfParsedShape,
      SelfConstructorInput,
      SelfConstructorError,
      SelfEncoded,
      SelfApi
    >,
    Headers,
    S.Schema<
      unknown,
      S.IntersectionE<S.MemberE<0, SelfParserError> | S.MemberE<1, ThatParserError>>,
      SelfParsedShape & ThatParsedShape,
      SelfConstructorInput & ThatConstructorInput,
      S.IntersectionE<
        S.MemberE<0, SelfConstructorError> | S.MemberE<1, ThatConstructorError>
      >,
      SelfEncoded & ThatEncoded,
      {}
    >
  >
  function a<
    Path extends S.SchemaAny,
    Body extends S.SchemaAny,
    Headers extends S.SchemaAny
  >(
    method: Methods,
    path: string,
    _: {
      headers?: Headers
      path?: Path
      body?: Body
    }
  ): WriteRequest<
    M,
    Path,
    Body,
    Headers,
    OrAny<Erase<typeof _.path & typeof _.body, S.SchemaAny>>
  > {
    const self =
      _.path && _.body
        ? _.path["|>"](S.intersect(_.body))
        : _.path
        ? _.path
        : _.body
        ? _.body
        : S.required({})
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
