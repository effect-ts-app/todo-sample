/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as Test from "@effect-ts/jest/Test"
import * as HF from "@effect-ts-app/core/http/http-client-fetch"
import { PositiveInt } from "@effect-ts-app/core/Schema"
import { LiveApiConfig } from "@effect-ts-demo/todo-client/config"
import { searchWithFields } from "@effect-ts-demo/todo-client/Tasks/_custom"
import fetch from "cross-fetch"

import { managedServer } from "@/test.setup"

const { URL, server } = managedServer()

const Env = L.all(
  LiveApiConfig({
    apiUrl: URL,
    userProfileHeader: JSON.stringify({
      sub: "0",
    }),
  }),
  HF.Client(fetch),
  server
)

const { it } = Test.runtime((l) => l[">+>"](Env))

it("works with full call", () =>
  T.gen(function* ($) {
    const allFields = yield* $(searchWithFields({}))
    expect(allFields.items[0].createdAt).toBeInstanceOf(Date)
    console.log(allFields)
  }))

it("works with partial call", () =>
  T.gen(function* ($) {
    const req = {
      $select: ["id", "title"] as const,
      $skip: PositiveInt.unsafe(10),
      $count: true,
    }

    const someFields = yield* $(searchWithFields(req))

    expect((someFields.items[0] as any).createdAt).toBeUndefined()
    console.log(someFields)
  }))
