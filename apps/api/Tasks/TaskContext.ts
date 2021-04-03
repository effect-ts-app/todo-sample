import * as A from "@effect-ts/core/Array"
import * as T from "@effect-ts/core/Effect"
import * as Map from "@effect-ts/core/Map"
import * as O from "@effect-ts/core/Option"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"

import { Task } from "@/../../packages/types"
import { NonEmptyString } from "@/../../packages/types/shared"

const tasks: Map.Map<UUID, Task> = [
  Task.create({ title: "My first Task" as NonEmptyString, steps: [] }),
  Task.create({ title: "My second Task" as NonEmptyString, steps: [] }),
]
  ["|>"](A.map((task) => [task.id, task] as const))
  ["|>"](Map.make)

export function find(id: UUID) {
  return T.effectTotal(() => O.fromNullable(tasks.get(id)))
}

export const all = T.effectTotal(() => [...tasks.values()] as const)
