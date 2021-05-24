/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as Test from "@effect-ts/jest/Test"
import * as O from "@effect-ts-app/core/ext/Option"
import { User } from "@effect-ts-demo/todo-types/"
import { Attachment, TaskAudits } from "@effect-ts-demo/todo-types/Task"

import * as h from "../test.helpers"
import { updateTask_ } from "./Update"

const { it } = Test.runtime()

const user = h.testUser()
const t = User.createTask_(user, {
  title: h.reasonableStringUnsafe("hi"),
})

it("changes the provided props", () =>
  T.succeedWith(() => {
    const [nt, nu] = updateTask_(t, user, { title: h.reasonableStringUnsafe("ho") })

    expect(nt.title).not.toBe(t.title)
    expect(nt.title).toBe("ho")
    expect(nu).toBe(user)
  }))

it("leaves unchanged", () =>
  T.succeedWith(() => {
    const [nt, nu] = updateTask_(t, user, {})

    expect(nt.title).toBe(t.title)
    expect(nu).toBe(user)
  }))

it("adds myday to user", () =>
  T.succeedWith(() => {
    const myDay = new Date()
    const [nt, nu] = updateTask_(t, user, {}, O.some(myDay))

    expect(nt.title).toBe(t.title)
    expect(nu).not.toBe(user)
    expect(nu.myDay).toEqual(expect.arrayContaining([{ id: t.id, date: myDay }]))
  }))

it("sets a new updatedAt", () =>
  T.succeedWith(() => {
    const [nt, nu] = updateTask_(t, user, {})

    expect(nt.updatedAt).not.toBe(t.updatedAt)
    expect(nu).toBe(user)
  }))

it("adds an Audit on file attachment added", () =>
  T.succeedWith(() => {
    const a = new Attachment({
      fileName: h.reasonableStringUnsafe("abc.gif"),
      url: h.longStringUnsafe("http://alabalbla/balbla/abc.gif"),
      mimetype: h.reasonableStringUnsafe("application/gif"),
    })

    const [nt, nu] = updateTask_(t, user, { attachment: O.some(a) })

    expect(t.auditLog.length).toBe(1)
    expect(nt.auditLog.length).toBe(2)
    expect(nt.auditLog[1]).toEqual(
      new TaskAudits.TaskFileAdded({
        createdAt: expect.any(Date),
        id: expect.any(String),
        userId: user.id,
        fileName: a.fileName,
      })
    )
    expect(nu).toBe(user)
  }))
