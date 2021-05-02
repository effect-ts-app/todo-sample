import { Step, Task, TaskE } from "@effect-ts-demo/todo-types"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as Map from "@effect-ts/core/Collections/Immutable/Map"
import * as T from "@effect-ts/core/Effect"
import * as Ref from "@effect-ts/core/Effect/Ref"
import { flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Ord } from "@effect-ts/core/Ord"
import * as Sy from "@effect-ts/core/Sync"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { encode } from "@effect-ts/morphic/Encoder"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"

import { NotFoundError } from "@/errors"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { NonEmptyString } from "@effect-ts-demo/core/ext/Model"

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
      {
        ...Task.create({
          title: "My third Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
        }),
        due: O.some(new Date(2021, 1, 1)),
      },
      {
        ...Task.create({
          title: "My third Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
        }),
        due: O.some(new Date(2021, 2, 1)),
      },

      {
        ...Task.create({
          title: "My fourth Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
        }),
        reminder: O.some(new Date(2021, 1, 1)),
      },

      {
        ...Task.create({
          title: "My fifth Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
        }),
        due: O.some(new Date(2021, 2, 1)),
      },

      {
        ...Task.create({
          title: "My sixth Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
        }),
        isFavorite: true,
      },

      {
        ...Task.create({
          title: "My seventh Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
        }),
        isFavorite: true,
      },

      {
        ...Task.create({
          title: "My eight Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
        }),
        myDay: O.some(new Date()),
      },
    ],
    A.map((task) => [task.id, runEncodeTask(task)] as const),
    Map.make
  )
)

const orderRef = Ref.unsafeMakeRef<A.Array<UUID>>([])

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
  tasksRef.get,
  T.chain((tasks) => T.forEach_(tasks.values(), decodeTask)),
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

export const getOrder = orderRef.get
export const setOrder = orderRef.set
export const allOrdered = pipe(
  T.structPar({ tasks: all, order: getOrder }),
  T.map(({ order, tasks }) => orderTasks(tasks["|>"](Chunk.toArray), order))
)

function orderTasks(a: A.Array<Task>, order: A.Array<UUID>) {
  return A.reverse(a)["|>"](A.sort(makeOrd(order)))
}

function makeOrd(sortingArr: A.Array<UUID>): Ord<Task> {
  return {
    compare: (a, b) => {
      const diff = sortingArr.indexOf(a.id) - sortingArr.indexOf(b.id)
      return diff > 1 ? 1 : diff < 0 ? -1 : 0
    },
  }
}
