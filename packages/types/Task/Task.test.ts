import * as O from "@effect-ts-app/core/Option"
import { ReasonableString } from "@effect-ts-app/core/Schema"
import { UserId } from "@effect-ts-demo/todo-types"

import { TaskCreated } from "./audit"
import { Task } from "./Task"

describe("Constructor", () => {
  describe("with task", () => {
    const t = new Task({
      createdBy: UserId.unsafe("1"),
      title: ReasonableString.unsafe("yay"),
      completed: O.some(new Date(2040, 12, 24)),
    })

    it("adds audit log", () => {
      expect(t.auditLog).toStrictEqual(
        expect.arrayContaining([
          new TaskCreated({
            userId: t.createdBy,
            createdAt: expect.any(Date),
            id: expect.any(String),
          }),
        ])
      )
    })
  })

  describe("completed", () => {
    it("Completed cannot be before createdAt", () => {
      expect(
        () =>
          new Task({
            createdBy: UserId.unsafe("1"),
            title: ReasonableString.unsafe("yay"),
            completed: O.some(new Date(1983, 12, 24)),
          })
      ).toThrow()
    })
  })
})
