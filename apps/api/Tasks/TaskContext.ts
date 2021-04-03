import { Step, Task } from "@effect-ts-demo/todo-types"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as A from "@effect-ts/core/Array"
import * as T from "@effect-ts/core/Effect"
import * as Map from "@effect-ts/core/Map"
import * as O from "@effect-ts/core/Option"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"

let tasks: Map.Map<UUID, Task> = [
  Task.create({
    title: "My first Task" as NonEmptyString,
    steps: [Step.create({ title: "first step" as NonEmptyString })],
  }),
  Task.create({ title: "My second Task" as NonEmptyString, steps: [] }),
  Task.create({
    title: "My third Task" as NonEmptyString,
    steps: [
      Step.build({ title: "first step" as NonEmptyString, completed: true }),
      Step.create({ title: "first step" as NonEmptyString }),
    ],
  })["|>"](Task.complete),
]
  ["|>"](A.map((task) => [task.id, task] as const))
  ["|>"](Map.make)

export function find(id: UUID) {
  return T.effectTotal(() => O.fromNullable(tasks.get(id)))
}

export const all = T.effectTotal(() => [...tasks.values()] as const)

export function add(t: Task) {
  return T.effectTotal(() => (tasks = tasks["|>"](Map.insert(t.id, t))))
}
