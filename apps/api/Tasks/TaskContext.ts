import { Step, Task, TaskE } from "@effect-ts-demo/todo-types"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as A from "@effect-ts/core/Array"
import * as T from "@effect-ts/core/Effect"
import { flow, pipe } from "@effect-ts/core/Function"
import * as Map from "@effect-ts/core/Map"
import * as O from "@effect-ts/core/Option"
import * as Sy from "@effect-ts/core/Sync"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { encode } from "@effect-ts/morphic/Encoder"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"

const encodeTask = flow(strict(Task).shrink, Sy.chain(encode(Task)))
const runEncodeTask = flow(encodeTask, Sy.run)
let tasks: Map.Map<UUID, TaskE> = [
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
]
  ["|>"](A.map((task) => [task.id, runEncodeTask(task)] as const))
  ["|>"](Map.make)

const { decode: decodeTask } = strictDecoder(Task)
export function find(id: UUID) {
  return pipe(
    O.fromNullable(tasks.get(id)),
    O.fold(
      () => T.succeed(O.none as O.Option<Task>),
      flow(decodeTask, T.map(O.some), T.orDie)
    )
  )
}

export const all = pipe(
  T.effectTotal(() => [...tasks.values()] as const),
  T.chain(T.forEach(decodeTask)),
  T.orDie
)

export function add(t: Task) {
  return T.effectTotal(() => (tasks = tasks["|>"](Map.insert(t.id, runEncodeTask(t)))))
}
