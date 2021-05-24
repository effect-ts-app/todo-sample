/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as Test from "@effect-ts/jest/Test"
import * as O from "@effect-ts-app/core/ext/Option"
import { TaskAudits, TaskEvents } from "@effect-ts-demo/todo-types/Task"

import * as h from "../test.helpers"
import { createTask_ } from "./Create"

const { it } = Test.runtime()

const user = h.testUser()

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
