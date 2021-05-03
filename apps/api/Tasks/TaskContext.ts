import { Task, TaskId, User, UserId } from "@effect-ts-demo/todo-types"
import { Has } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as Map from "@effect-ts/core/Collections/Immutable/Map"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as Ref from "@effect-ts/core/Effect/Ref"
import { flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Ord } from "@effect-ts/core/Ord"
import * as Sy from "@effect-ts/core/Sync"
import { _A } from "@effect-ts/core/Utils"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { encode } from "@effect-ts/morphic/Encoder"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"

import { NotFoundError } from "@/errors"

import { makeTestData } from "./TaskContext.testdata"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"

const encodeUser = flow(strict(User).shrink, Sy.chain(encode(User)))
const encodeTask = flow(strict(Task).shrink, Sy.chain(encode(Task)))
const { decode: decodeTask } = strictDecoder(Task)
const { decode: decodeUser } = strictDecoder(User)

const makeMockTaskContext = T.gen(function* ($) {
  const { tasks, users } = yield* $(makeTestData)

  const usersRef = yield* $(
    pipe(
      A.map_(users, (u) => Sy.tuple(Sy.succeed(u.id), encodeUser(u))),
      Sy.collectAll,
      Sy.map(Map.make),
      T.chain(Ref.makeRef)
    )
  )

  const tasksRef = yield* $(
    pipe(
      A.map_(tasks, (task) => Sy.tuple(Sy.succeed(task.id), encodeTask(task))),
      Sy.collectAll,
      Sy.map(Map.make),
      T.chain(Ref.makeRef)
    )
  )

  const findUser = (id: UserId) =>
    pipe(
      usersRef.get,
      T.map((users) => O.fromNullable(users.get(id))),
      EO.chain(flow(decodeUser, EO.fromEffect, T.orDie))
    )

  const getUser = (id: UserId) =>
    pipe(
      findUser(id),
      T.chain(O.fold(() => T.fail(new NotFoundError("User", id.toString())), T.succeed))
    )

  const find = (id: TaskId) =>
    pipe(
      tasksRef.get,
      T.map((tasks) => O.fromNullable(tasks.get(id))),
      EO.chain(flow(decodeTask, EO.fromEffect, T.orDie))
    )

  const get = (id: TaskId) =>
    pipe(
      find(id),
      T.chain(O.fold(() => T.fail(new NotFoundError("Task", id)), T.succeed))
    )

  const add = (t: Task) =>
    pipe(
      T.structPar({ encT: encodeTask(t), tasks: tasksRef.get }),
      T.chain(({ encT, tasks }) => tasksRef.set(tasks["|>"](Map.insert(t.id, encT))))
    )

  const del = (id: TaskId) =>
    pipe(
      T.tuple(tasksRef.get, get(id)),
      T.chain(({ tuple: [tasks] }) => tasksRef.set(tasks["|>"](Map.remove(id))))
    )

  const getOrder = (uid: UserId) =>
    pipe(
      getUser(uid),
      T.map((u) => u.order)
    )

  const all = (userId: UserId) =>
    pipe(
      tasksRef.get,
      T.chain((tasks) =>
        [...tasks.values()]
          ["|>"](
            A.filter(
              (x) =>
                // TODO: Or task is part of a List that a user is Member of ;-)
                x.createdBy === userId
            )
          )
          ["|>"](T.forEach(decodeTask))
      ),
      T.orDie
    )

  return {
    findUser,
    getUser,
    find,
    get,
    all,
    update: (id: TaskId, mod: (a: Task) => Task) =>
      pipe(get(id), T.map(mod), T.chain(add)),
    updateM: <R, E>(id: TaskId, mod: (a: Task) => T.Effect<R, E, Task>) =>
      pipe(get(id), T.chain(mod), T.chain(add)),
    add,
    delete: del,
    remove: (t: Task) => del(t.id),
    getOrder,
    setOrder: (uid: UserId, order: A.Array<TaskId>) =>
      pipe(
        getUser(uid),
        T.map((u) => ({ ...u, order })),
        T.chain(encodeUser),
        T.chain((u) => Ref.update_(usersRef, Map.insert(uid, u)))
      ),
    allOrdered: (userId: UserId) =>
      pipe(
        T.structPar({ tasks: all(userId), order: getOrder(userId) }),
        T.map(({ order, tasks }) => orderTasks(tasks["|>"](Chunk.toArray), order))
      ),
  }
})

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

export interface TaskContext extends _A<typeof makeMockTaskContext> {}
export const TaskContext = Has.tag<TaskContext>()
export const MockTaskContext = L.fromEffect(TaskContext)(makeMockTaskContext)

export const {
  add,
  allOrdered,
  find,
  get,
  getUser,
  remove,
  setOrder,
  update,
} = T.deriveLifted(TaskContext)(
  ["add", "get", "getUser", "find", "remove", "allOrdered", "setOrder", "update"],
  [],
  []
)
// delete is a reserved keyword :S
const _ = T.deriveLifted(TaskContext)(["delete"], [], [])
const del = _.delete
export { del as delete }

// generics cannot be derived
export function updateM<R, E>(id: TaskId, mod: (a: Task) => T.Effect<R, E, Task>) {
  return T.gen(function* ($) {
    const { updateM } = yield* $(TaskContext)
    return updateM(id, mod)
  })
}
