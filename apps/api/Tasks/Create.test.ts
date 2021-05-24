/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as Test from "@effect-ts/jest/Test"
import * as O from "@effect-ts-app/core/ext/Option"
import { User } from "@effect-ts-demo/todo-types/"
import { TaskAudits, TaskEvents } from "@effect-ts-demo/todo-types/Task"

import * as h from "../test.helpers"
import { createTask_ } from "./Create"

const { it } = Test.runtime()

const user = new User({
  id: h.userIdUnsafe("2"),
  name: h.reasonableStringUnsafe("Patroklos"),
  email: h.emailUnsafe("some@test.com"),
  phoneNumber: h.phoneNumberUnsafe("555-444-123"),
})

it("returns domain events", () =>
  T.succeedWith(() => {
    const [t, events] = createTask_(user, {
      listId: "inbox",
      myDay: O.none,
      isFavorite: false,
      title: h.reasonableStringUnsafe("Test task"),
    })

    expect(events).toEqual([
      new TaskEvents.TaskCreated({ myDay: O.none, userId: user.id, taskId: t.id }),
    ])
  }))

it("adds an Audit on creation", () =>
  T.succeedWith(() => {
    const [t] = createTask_(user, {
      listId: "inbox",
      myDay: O.none,
      isFavorite: false,
      title: h.reasonableStringUnsafe("Test task"),
    })

    expect(t.auditLog[0]).toEqual(
      new TaskAudits.TaskCreated({
        createdAt: expect.any(Date),
        id: expect.any(String),
        userId: user.id,
      })
    )
  }))
