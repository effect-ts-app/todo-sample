import { Parser } from "@effect-ts-demo/core/ext/Schema"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { Has } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { _A } from "@effect-ts/core/Utils"

const parsePositiveInt = Parser.for(S.positiveInt)["|>"](S.condemnFail)

function makeUserEnv(authorization: string) {
  return T.struct({
    id: parsePositiveInt(parseInt(authorization)),
  })
}

export interface UserEnv extends _A<ReturnType<typeof makeUserEnv>> {}
export const UserEnv = Has.tag<UserEnv>()

export const LiveUserEnv = (authorization: string) =>
  L.fromEffect(UserEnv)(makeUserEnv(authorization))
