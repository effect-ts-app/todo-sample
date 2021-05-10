import * as T from "@effect-ts/core/Effect"
import { AType, M } from "@effect-ts/morphic"
import { SchemaAny } from "@effect-ts/schema"

import * as TaskContext from "./TaskContext"

import * as S from "@effect-ts-demo/core/ext/Schema"
import { UserSVC } from "@effect-ts-demo/infra/services"

export const getLoggedInUser = T.gen(function* ($) {
  const user = yield* $(UserSVC.UserEnv)
  return yield* $(TaskContext.getUser(user.id))
})

export function makeHandler<
  TReq extends M<{}, any, any>,
  TRes extends M<{}, any, any>
>(_: { Request: TReq; Response: TRes }) {
  // TODO: Prevent over providing, although strict encoding removes it already.
  return <R, E>(h: (r: AType<TReq>) => T.Effect<R, E, AType<TRes>>) => h
}

export function handle<
  TReq extends { Model: SchemaAny },
  TRes extends { Model: SchemaAny } | SchemaAny = typeof S.Void
>(_: { Request: TReq; Response?: TRes }) {
  // TODO: Prevent over providing // no strict/shrink yet.
  return <R, E>(
    h: (
      r: S.ParsedShapeOf<TReq["Model"]>
    ) => T.Effect<R, E, S.ParsedShapeOf<Extr<TRes>>>
  ) =>
    Object.assign(h, { Request: _.Request, Response: (_.Response ?? S.Void) as TRes })
}

type Extr<T> = T extends { Model: SchemaAny }
  ? T["Model"]
  : T extends SchemaAny
  ? T
  : never
