/* eslint-disable @typescript-eslint/no-explicit-any */
import * as T from "@effect-ts/core/Effect"
import * as Test from "@effect-ts/jest/Test"
import * as O from "@effect-ts-app/core/Option"
import { ReasonableString } from "@effect-ts-app/core/Schema"
import { TaskAudits, TaskEvents } from "@effect-ts-demo/todo-types/Task"

import { testUser } from "@/test.helpers"

import { createTask_ } from "./Create"

const { it } = Test.runtime()

const user = testUser()

it("returns domain events", () =>
  T.succeedWith(() => {
    const [task, events] = createTask_(user, {
      listId: "inbox",
      myDay: O.none,
      isFavorite: false,
      title: ReasonableString.unsafe("Test task"),
    })

    expect(events).toEqual([
      new TaskEvents.TaskCreated({ myDay: O.none, userId: user.id, taskId: task.id }),
    ])
  }))

it("adds an Audit on creation", () =>
  T.succeedWith(() => {
    const [task] = createTask_(user, {
      listId: "inbox",
      myDay: O.none,
      isFavorite: false,
      title: ReasonableString.unsafe("Test task"),
    })

    expect(task.auditLog[0]).toEqual(
      new TaskAudits.TaskCreated({
        createdAt: expect.any(Date),
        id: expect.any(String),
        userId: user.id,
      })
    )
  }))
