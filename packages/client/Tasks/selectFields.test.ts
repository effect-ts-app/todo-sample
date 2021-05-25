/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as Test from "@effect-ts/jest/Test"
import * as HF from "@effect-ts-app/core/http/http-client-fetch"
import fetch from "cross-fetch"

import { LiveApiConfig } from "../config"
import { positiveIntUnsafe } from "../test.helpers"
import { searchWithFields } from "./_custom"

const Env = LiveApiConfig({
  apiUrl: "http://localhost:3330",
  userProfileHeader: JSON.stringify({
    sub: "0",
  }),
})["+++"](HF.Client(fetch))

const { it } = Test.runtime((l) => l["+++"](Env))

it("works with full call", () =>
  T.gen(function* ($) {
    const search = searchWithFields({})

    const allFields = yield* $(search)
    expect(allFields.items[0].createdAt).toBeInstanceOf(Date)
    console.log(allFields)
  }))

it("works with partial call", () =>
  T.gen(function* ($) {
    const req = {
      $select: ["id", "title"] as const,
      $skip: positiveIntUnsafe(10),
      $count: true,
    }
    const searchWithSomeFields = searchWithFields(req)

    const someFields = yield* $(searchWithSomeFields)

    expect((someFields.items[0] as any).createdAt).toBeUndefined()
    console.log(someFields)
  }))
