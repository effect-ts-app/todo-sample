import { Get, namedC } from "@effect-ts-app/core/ext/Schema"
import * as T from "@effect-ts/core/Effect"

import { handle } from "@/shared"

@namedC("AllSample")
export class Request extends Get("/")<Request>()() {}

export default handle({ Request })((_) => T.unit)
