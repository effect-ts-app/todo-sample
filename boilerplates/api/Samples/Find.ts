import {
  Get,
  Model,
  namedC,
  nonEmptyString,
  prop,
} from "@effect-ts-app/core/ext/Schema"
import * as T from "@effect-ts/core/Effect"

import { handle } from "@/shared"

@namedC("FindSample")
export class Request extends Get("/:id")<Request>()({
  id: prop(nonEmptyString),
}) {}

export class Response extends Model<Response>()({
  id: prop(nonEmptyString),
}) {}

export default handle({ Request, Response })((_) =>
  T.gen(function* ($) {
    return yield* $(
      T.succeed({
        id: _.id,
      })
    )
  })
)
