/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as Test from "@effect-ts/jest/Test"
import * as O from "@effect-ts-app/core/ext/Option"
import { User } from "@effect-ts-demo/todo-types/"
import { TaskAudits } from "@effect-ts-demo/todo-types/Task"
import { Attachment } from "@effect-ts-demo/todo-types/Task/shared"

import * as h from "../test.helpers"
import { updateTask } from "./Update"

const { it } = Test.runtime()

const user = h.testUser()
const task = User.createTask_(user, {
  title: h.reasonableStringUnsafe("hi"),
})

it("changes the provided props", () =>
  T.succeedWith(() => {
    const [nt, nu] = updateTask({ title: h.reasonableStringUnsafe("ho") })(task, user)

    expect(nt.title).not.toBe(task.title)
    expect(nt.title).toBe("ho")
    expect(nu).toBe(user)
  }))

it("leaves unchanged", () =>
  T.succeedWith(() => {
    const [nt, nu] = updateTask({})(task, user)

    expect(nt.title).toBe(task.title)
    expect(nu).toBe(user)
  }))

it("adds myday to user", () =>
  T.succeedWith(() => {
    const myDay = new Date()
    const [nt, nu] = updateTask({}, O.some(myDay))(task, user)

    expect(nt.title).toBe(task.title)
    expect(nu).not.toBe(user)
    expect(nu.myDay).toEqual(expect.arrayContaining([{ id: task.id, date: myDay }]))
  }))

it("sets a new updatedAt", () =>
  T.succeedWith(() => {
    const [nt, nu] = updateTask({})(task, user)

    expect(nt.updatedAt).not.toBe(task.updatedAt)
    expect(nu).toBe(user)
  }))

it("adds an Audit on file attachment added", () =>
  T.succeedWith(() => {
    const a = new Attachment({
      fileName: h.reasonableStringUnsafe("abc.gif"),
      url: h.longStringUnsafe("http://alabalbla/balbla/abc.gif"),
      mimetype: h.reasonableStringUnsafe("application/gif"),
    })

    const [nt, nu] = updateTask({ attachment: O.some(a) })(task, user)

    expect(task.auditLog.length).toBe(1)
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
