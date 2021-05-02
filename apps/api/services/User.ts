import { Has } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { _A } from "@effect-ts/core/Utils"

import { PositiveInt } from "@effect-ts-demo/core/ext/Model"

function makeUserEnv(authorization: string) {
  return T.struct({ id: PositiveInt.decodeV_(parseInt(authorization)) })
}

export interface UserEnv extends _A<ReturnType<typeof makeUserEnv>> {}
export const UserEnv = Has.tag<UserEnv>()

export const LiveUserEnv = (authorization: string) =>
  L.fromEffect(UserEnv)(makeUserEnv(authorization))
