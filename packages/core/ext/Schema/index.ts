import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { v4 } from "uuid"

import { constant, Lazy, pipe } from "../Function"

import * as S from "./_schema"
import { schemaField } from "./_schema"

export function makeUuid() {
  return v4() as S.UUID
}

export const namedC = function (cls: any) {
  cls[schemaField] = cls[schemaField]["|>"](S.named(cls.name))
  return cls
}

type LazyPartial<T> = {
  [P in keyof T]?: Lazy<T[P]>
}

export function withDefaultConstructorFields<
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  Encoded,
  Api
>(
  self: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >
) {
  // TODO: but allow NO OTHERS!
  return <Changes extends LazyPartial<ConstructorInput>>(
    kvs: Changes
  ): S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    Omit<ConstructorInput, keyof Changes> &
      // @ts-expect-error we know keyof Changes matches
      Partial<Pick<ConstructorInput, keyof Changes>>,
    ConstructorError,
    Encoded,
    Api
  > => {
    const constructSelf = S.Constructor.for(self)
    return pipe(
      self,
      S.constructor((u: any) =>
        constructSelf({
          ...u,
          ...Object.keys(kvs).reduce((prev, cur) => {
            if (typeof u[cur] === "undefined") {
              // @ts-expect-error we know we may run and assign
              prev[cur] = kvs[cur]()
            }
            return prev
          }, {} as any),
        } as any)
      )
    )
  }
}

export const constArray = constant(A.empty)

export * from "./_api"
// TODO; vendor Model.
export { Model } from "./Model"
export type { SchemaForModel } from "./Model"
export * from "./Model"

export * from "./vendor"
