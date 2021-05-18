import {
  Get,
  Model,
  namedC,
  nonEmptyString,
  prop,
} from "@effect-ts-app/core/ext/Schema"
import { UserSVC } from "@effect-ts-app/infra/services"
import * as T from "@effect-ts/core/Effect"

import { handle } from "@/shared"

@namedC("AllLoggedInSample")
export class Request extends Get("/logged-in")<Request>()() {}

export class Response extends Model<Response>()({
  userId: prop(nonEmptyString),
}) {}

export default handle({ Request, Response })((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserEnv)

    return {
      userId: user.id,
    }
  })
)
