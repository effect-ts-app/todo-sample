import { Step, Task, TaskE } from "@effect-ts-demo/todo-types"
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Map from "@effect-ts/core/Collections/Immutable/Map"
import * as T from "@effect-ts/core/Effect"
import * as Ref from "@effect-ts/core/Effect/Ref"
import { flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as Sy from "@effect-ts/core/Sync"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { encode } from "@effect-ts/morphic/Encoder"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"

import { NotFoundError } from "@/errors"

const encodeTask = flow(strict(Task).shrink, Sy.chain(encode(Task)))
const runEncodeTask = flow(encodeTask, Sy.run)

const tasksRef = Ref.unsafeMakeRef<Map.Map<UUID, TaskE>>(
  pipe(
    [
      Task.create({
        title: "My first Task" as NonEmptyString,
        steps: [Step.create({ title: "first step" as NonEmptyString })],
      }),
      Task.create({ title: "My second Task" as NonEmptyString, steps: [] }),
      Task.create({
        title: "My third Task" as NonEmptyString,
        steps: [
          Step.build({ title: "first step" as NonEmptyString, completed: true }),
          Step.create({ title: "second step" as NonEmptyString }),
        ],
      })["|>"](Task.complete),
    ],
    A.map((task) => [task.id, runEncodeTask(task)] as const),
    Map.make
  )
)

const { decode: decodeTask } = strictDecoder(Task)
export function find(id: UUID) {
  return pipe(
    tasksRef.get["|>"](T.map((tasks) => O.fromNullable(tasks.get(id)))),
    EO.chain(flow(decodeTask, EO.fromEffect, T.orDie))
  )
}

export function get(id: UUID) {
  return pipe(
    find(id),
    T.chain(O.fold(() => T.fail(new NotFoundError("Task", id)), T.succeed))
  )
}

export const all = pipe(
  tasksRef.get["|>"](T.chain((tasks) => T.forEach_(tasks.values(), decodeTask))),
  T.orDie
)

export function add(t: Task) {
  return pipe(
    T.structPar({ encT: encodeTask(t), tasks: tasksRef.get }),
    T.chain(({ encT, tasks }) => tasksRef.set(tasks["|>"](Map.insert(t.id, encT))))
  )
}

export function remove(t: Task) {
  return tasksRef.get["|>"](
    T.chain((tasks) => tasksRef.set(tasks["|>"](Map.remove(t.id))))
  )
}
