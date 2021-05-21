import * as S from "@effect-ts-app/core/ext/Schema"
import * as HF from "@effect-ts-app/core/http/http-client-fetch"
import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import * as Test from "@effect-ts/jest/Test"
import fetch from "cross-fetch"

import { LiveApiConfig } from "../config"

import { searchWithFields } from "./_custom"

const { it } = Test.runtime()

const Env = LiveApiConfig({
  apiUrl: "http://localhost:3330",
  userProfileHeader: JSON.stringify({
    sub: "0",
  }),
})[">+>"](HF.Client(fetch))
const createPInt = S.Constructor.for(S.positiveInt)["|>"](S.unsafe)

it("works", () =>
  pipe(
    T.gen(function* ($) {
      const req = {
        $select: ["id", "title"] as const,
        $skip: createPInt(10),
        $count: true,
      }
      const search = searchWithFields({})
      const searchWithSomeFields = searchWithFields(req)

      const allFields = yield* $(search)
      const someFields = yield* $(searchWithSomeFields)
      console.log(allFields, someFields)
    }),
    T.provideSomeLayer(Env)
  ))
