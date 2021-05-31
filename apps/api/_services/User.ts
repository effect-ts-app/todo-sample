import { Has } from "@effect-ts/core"
import * as L from "@effect-ts/core/Effect/Layer"
import { pipe } from "@effect-ts-app/core/Function"
import * as MO from "@effect-ts-app/core/Schema"
import { jwt } from "@effect-ts-app/infra/express/schema/jwt"

export class UserProfileScheme extends MO.Model<UserProfileScheme>()({
  /**
   * Mapped from "sub"
   */
  id: MO.prop(MO.nonEmptyString).from("sub"),
}) {}

export interface UserProfile extends UserProfileScheme {}
export const UserProfile = Has.tag<UserProfile>()

export const LiveUserProfile = (profile: UserProfile) => L.pure(UserProfile)(profile)

const userProfileFromJson = MO.json[">>>"](UserProfileScheme.Model)
const parseUserProfileFromJson = MO.Parser.for(userProfileFromJson)
const userProfileFromJWT = jwt[">>>"](UserProfileScheme.Model)
const parseUserProfileFromJWT = MO.Parser.for(userProfileFromJWT)

export const makeUserProfileFromAuthorizationHeader = (authorization: unknown) =>
  pipe(parseUserProfileFromJWT["|>"](MO.condemnFail)(authorization))
export const makeUserProfileFromUserHeader = (user: unknown) =>
  pipe(parseUserProfileFromJson["|>"](MO.condemnFail)(user))

// const parseUnsafe = MO.Parser.for(UserProfile.Model)["|>"](MO.unsafe)
// const p1 = parseUnsafe({ sub: "bla" })
// console.log(p1)
// const p2 = parseUnsafe({ id: "bla" })
// console.log(p2)
// console.log(parseUnsafe(undefined))
