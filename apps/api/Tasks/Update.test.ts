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

const user = testUser()
const initialTask = user["|>"](
  User.createTask({
    title: reasonableStringUnsafe("hi"),
  })
)

it("changes the provided props", () =>
  T.succeedWith(() => {
    const [task, events] = initialTask["|>"](
      updateTask({ title: reasonableStringUnsafe("ho") }, user.id)
    )

    expect(task.title).not.toBe(initialTask.title)
    expect(task.updatedAt).not.toBe(initialTask.updatedAt)
    expect(task.title).toBe("ho")
    expect(events[0]._tag).toBe("TaskUpdated")
  }))

it("leaves unchanged", () =>
  T.succeedWith(() => {
    const [task, events] = initialTask["|>"](updateTask({}, user.id))

    expect(task).toBe(initialTask)
    expect(events.length).toBe(0)
  }))

it("adds myday to user", () =>
  T.succeedWith(() => {
    const myDay = new Date()
    const [task, events] = initialTask["|>"](
      updateTask({ myDay: O.some(myDay) }, user.id)
    )

    expect(task.title).toBe(initialTask.title)
    expect(events).not.toBe(user)
    expect(events[0]._tag).toBe("TaskUpdated")
    expect(
      events[0]._tag === "TaskUpdated" && events[0].userChanges.myDay
    ).not.toBeUndefined()
  }))

it("adds reminder to user", () =>
  T.succeedWith(() => {
    const myDay = new Date()
    const [task, events] = initialTask["|>"](
      updateTask({ reminder: O.some(myDay) }, user.id)
    )

    expect(task.title).toBe(initialTask.title)
    expect(events).not.toBe(user)
    expect(events[0]._tag).toBe("TaskUpdated")
    expect(
      events[0]._tag === "TaskUpdated" && events[0].userChanges.reminder
    ).not.toBeUndefined()
  }))

it("adds an Audit on file attachment added", () =>
  T.succeedWith(() => {
    const a = new Attachment({
      fileName: reasonableStringUnsafe("abc.gif"),
      url: longStringUnsafe("http://alabalbla/balbla/abc.gif"),
      mimetype: reasonableStringUnsafe("application/gif"),
    })

    const [task, events] = initialTask["|>"](
      updateTask({ attachment: O.some(a) }, user.id)
    )

    expect(initialTask.auditLog.length).toBe(1)
    expect(task.auditLog.length).toBe(2)
    expect(task.auditLog[1]).toEqual(
      new TaskAudits.TaskFileAdded({
        createdAt: expect.any(Date),
        id: expect.any(String),
        userId: user.id,
        fileName: a.fileName,
      })
    )
    expect(events.length).toBe(1)
  }))
