import { pipe } from "@effect-ts-app/core/ext/Function"
import * as S from "@effect-ts-app/core/ext/Schema"
import { jwt } from "@effect-ts-app/infra/express/schema/jwt"
import { Has } from "@effect-ts/core"
import * as L from "@effect-ts/core/Effect/Layer"

export class UserProfile extends S.Model<UserProfile>()({
  /**
   * Mapped from "sub"
   */
  id: S.prop(S.nonEmptyString).from("sub"),
}) {}

export interface UserProfile extends UserProfile {}
export const UserProfile = Has.tag<UserProfile>()

export const LiveUserProfile = (profile: UserProfile) => L.pure(UserProfile)(profile)

const userProfileFromJson = S.json[">>>"](UserProfile.Model)
const parseUserProfileFromJson = S.Parser.for(userProfileFromJson)
const userProfileFromJWT = jwt[">>>"](UserProfile.Model)
const parseUserProfileFromJWT = S.Parser.for(userProfileFromJWT)

export const LiveUserProfileFromAuthorizationHeader = (authorization: unknown) =>
  L.fromEffect(UserProfile)(
    pipe(parseUserProfileFromJWT["|>"](S.condemnFail)(authorization))
  )
export const LiveUserProfileFromUserHeader = (user: unknown) =>
  L.fromEffect(UserProfile)(pipe(parseUserProfileFromJson["|>"](S.condemnFail)(user)))

// const parseUnsafe = S.Parser.for(UserProfile.Model)["|>"](S.unsafe)
// const p1 = parseUnsafe({ sub: "bla" })
// console.log(p1)
// const p2 = parseUnsafe({ id: "bla" })
// console.log(p2)
// console.log(parseUnsafe(undefined))
