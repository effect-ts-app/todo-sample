/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as Test from "@effect-ts/jest/Test"
import * as O from "@effect-ts-app/core/ext/Option"
import { Attachment, Task, TaskAudits } from "@effect-ts-demo/todo-types/Task"

import * as h from "../test.helpers"
import { updateTask_ } from "./Update"

const { it } = Test.runtime()
const userId = h.userIdUnsafe("2")

let t: Task
beforeEach(
  () =>
    (t = new Task({
      title: h.reasonableStringUnsafe("hi"),
      createdBy: h.nonEmptyStringUnsafe("1"),
    }))
)

it("changes the provided props", () =>
  T.succeedWith(() => {
    const nt = updateTask_(t, userId, { title: h.reasonableStringUnsafe("ho") })

    expect(nt.title).not.toBe(t.title)
    expect(nt.title).toBe("ho")
  }))

it("leaves unchanged", () =>
  T.succeedWith(() => {
    const nt = updateTask_(t, userId, {})

    expect(nt.title).toBe(t.title)
  }))

it("sets a new updatedAt", () =>
  T.succeedWith(() => {
    const nt = updateTask_(t, userId, {})

    expect(nt.updatedAt).not.toBe(t.updatedAt)
  }))

it("adds an Audit on file attachment added", () =>
  T.succeedWith(() => {
    const a = new Attachment({
      fileName: h.reasonableStringUnsafe("abc.gif"),
      url: h.longStringUnsafe("http://alabalbla/balbla/abc.gif"),
      mimetype: h.reasonableStringUnsafe("application/gif"),
    })

    const nt = updateTask_(t, userId, { attachment: O.some(a) })

    expect(nt.auditLog[1]).toEqual(
      new TaskAudits.TaskFileAdded({
        createdAt: expect.any(Date),
        id: expect.any(String),
        userId,
        fileName: a.fileName,
      })
    )
  }))
