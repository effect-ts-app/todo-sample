import * as S from "@effect-ts-demo/core/ext/Schema"
import { Has } from "@effect-ts/core"
import * as L from "@effect-ts/core/Effect/Layer"
import { _A } from "@effect-ts/core/Utils"

export class UserProfile extends S.Model<UserProfile>()(
  S.required({ sub: S.nonEmptyString })
) {}

// unknown -> string -> JSON/unknown -> UserProfile
const parseUserProfile = UserProfile.Parser["|>"](S.condemnFail)

function makeUserEnv(profile: S.EncodedOf<typeof UserProfile["Model"]>) {
  return parseUserProfile(profile)
}

export interface UserEnv extends _A<ReturnType<typeof makeUserEnv>> {}
export const UserEnv = Has.tag<UserEnv>()

export const LiveUserEnv = (profile: S.EncodedOf<typeof UserProfile["Model"]>) =>
  L.fromEffect(UserEnv)(makeUserEnv(profile))
