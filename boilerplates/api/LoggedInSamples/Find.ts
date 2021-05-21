import { UserSVC } from "@/services"
import {
  Get,
  Model,
  namedC,
  nonEmptyString,
  prop,
} from "@effect-ts-app/core/ext/Schema"
import { handle } from "@effect-ts-app/infra/app"
import * as T from "@effect-ts/core/Effect"

@namedC("FindLoggedInSample")
export class Request extends Get("/logged-in/:id")<Request>()({
  id: prop(nonEmptyString),
}) {}

export class Response extends Model<Response>()({
  id: prop(nonEmptyString),
  userId: prop(nonEmptyString),
}) {}

export default handle({ Request, Response })((_) =>
  T.gen(function* ($) {
    const user = yield* $(UserSVC.UserProfile)

    return {
      id: _.id,
      userId: user.id,
    }
  })
)
