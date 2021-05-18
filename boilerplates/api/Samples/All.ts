import { Get, namedC } from "@effect-ts-app/core/ext/Schema"
import { handle } from "@effect-ts-app/infra/app"
import * as T from "@effect-ts/core/Effect"

@namedC("AllSample")
export class Request extends Get("/")<Request>()() {}

export default handle({ Request })((_) => T.unit)
