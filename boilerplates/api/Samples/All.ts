import { Get, namedC } from "@effect-ts-app/core/ext/Schema"
import { handle } from "@effect-ts-app/infra/app"
import * as T from "@effect-ts/core/Effect"

@namedC
export class AllSample extends Get("/")<AllSample>()() {}

export default handle({ Request: AllSample })((_) => T.unit)
