import { pipe } from "@effect-ts-app/core/ext/Function"
import * as S from "@effect-ts-app/core/ext/Schema"
import { jwt } from "@effect-ts-app/infra/express/schema/jwt"
import { Has } from "@effect-ts/core"
import * as L from "@effect-ts/core/Effect/Layer"

export class UserProfileScheme extends S.Model<UserProfileScheme>()({
  /**
   * Mapped from "sub"
   */
  id: S.prop(S.nonEmptyString).from("sub"),
}) {}

export interface UserProfile extends UserProfileScheme {}
export const UserProfile = Has.tag<UserProfile>()

export const LiveUserProfile = (profile: UserProfile) => L.pure(UserProfile)(profile)

const userProfileFromJson = S.json[">>>"](UserProfileScheme.Model)
const parseUserProfileFromJson = S.Parser.for(userProfileFromJson)
const userProfileFromJWT = jwt[">>>"](UserProfileScheme.Model)
const parseUserProfileFromJWT = S.Parser.for(userProfileFromJWT)

export const makeUserProfileFromAuthorizationHeader = (authorization: unknown) =>
  pipe(parseUserProfileFromJWT["|>"](S.condemnFail)(authorization))
export const makeUserProfileFromUserHeader = (user: unknown) =>
  pipe(parseUserProfileFromJson["|>"](S.condemnFail)(user))

// const parseUnsafe = S.Parser.for(UserProfile.Model)["|>"](S.unsafe)
// const p1 = parseUnsafe({ sub: "bla" })
// console.log(p1)
// const p2 = parseUnsafe({ id: "bla" })
// console.log(p2)
// console.log(parseUnsafe(undefined))
