/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as Test from "@effect-ts/jest/Test"
import { Task } from "@effect-ts-demo/todo-types/Task"

import * as h from "../test.helpers"
import { updateTask } from "./Update"

const { it } = Test.runtime()

it("changes the provided", () =>
  T.succeedWith(() => {
    const t = new Task({
      title: h.reasonableStringUnsafe("hi"),
      createdBy: h.nonEmptyStringUnsafe("1"),
    })

    const nt = updateTask({ title: h.reasonableStringUnsafe("ho") })(t)

    expect(nt.title).not.toBe(t.title)
    expect(nt.title).toBe("ho")
  }))

it("leaves unchanged", () =>
  T.succeedWith(() => {
    const t = new Task({
      title: h.reasonableStringUnsafe("hi"),
      createdBy: h.nonEmptyStringUnsafe("1"),
    })

    const nt = updateTask({})(t)

    expect(nt.title).toBe(t.title)
  }))

it("sets a new updatedAt", () =>
  T.succeedWith(() => {
    const t = new Task({
      title: h.reasonableStringUnsafe("hi"),
      createdBy: h.nonEmptyStringUnsafe("1"),
    })

    const nt = updateTask({})(t)

    expect(nt.updatedAt).not.toBe(t.updatedAt)
  }))
