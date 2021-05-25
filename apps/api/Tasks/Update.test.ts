/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as Test from "@effect-ts/jest/Test"
import * as O from "@effect-ts-app/core/ext/Option"
import { User } from "@effect-ts-demo/todo-types/"
import { TaskAudits } from "@effect-ts-demo/todo-types/Task"
import { Attachment } from "@effect-ts-demo/todo-types/Task/shared"

import { longStringUnsafe, reasonableStringUnsafe, testUser } from "@/test.helpers"

import { updateTask } from "./Update"

const { it } = Test.runtime()

const initialUser = testUser()
const initialTask = User.createTask._(initialUser, {
  title: reasonableStringUnsafe("hi"),
})

it("changes the provided props", () =>
  T.succeedWith(() => {
    const [task, user] = updateTask({ title: reasonableStringUnsafe("ho") })(
      initialTask,
      initialUser
    )

    expect(task.title).not.toBe(initialTask.title)
    expect(task.updatedAt).not.toBe(initialTask.updatedAt)
    expect(task.title).toBe("ho")
    expect(user).toBe(initialUser)
  }))

it("leaves unchanged", () =>
  T.succeedWith(() => {
    const [task, user] = updateTask({})(initialTask, initialUser)

    expect(task).toBe(initialTask)
    expect(user).toBe(initialUser)
  }))

it("adds myday to initialUser", () =>
  T.succeedWith(() => {
    const myDay = new Date()
    const [task, user] = updateTask({}, O.some(myDay))(initialTask, initialUser)

    expect(task.title).toBe(initialTask.title)
    expect(user).not.toBe(initialUser)
    expect(user.myDay).toEqual(
      expect.arrayContaining([{ id: initialTask.id, date: myDay }])
    )
  }))

it("adds an Audit on file attachment added", () =>
  T.succeedWith(() => {
    const a = new Attachment({
      fileName: reasonableStringUnsafe("abc.gif"),
      url: longStringUnsafe("http://alabalbla/balbla/abc.gif"),
      mimetype: reasonableStringUnsafe("application/gif"),
    })

    const [task, user] = updateTask({ attachment: O.some(a) })(initialTask, initialUser)

    expect(initialTask.auditLog.length).toBe(1)
    expect(task.auditLog.length).toBe(2)
    expect(task.auditLog[1]).toEqual(
      new TaskAudits.TaskFileAdded({
        createdAt: expect.any(Date),
        id: expect.any(String),
        userId: initialUser.id,
        fileName: a.fileName,
      })
    )
    expect(user).toBe(initialUser)
  }))
