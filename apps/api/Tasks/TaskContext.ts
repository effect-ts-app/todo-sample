import {
  Task,
  TaskId,
  TaskListId,
  TaskListOrGroup,
  User,
  UserId,
} from "@effect-ts-demo/todo-types"
import { Has } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as Map from "@effect-ts/core/Collections/Immutable/Map"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as Ref from "@effect-ts/core/Effect/Ref"
import { flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as Sy from "@effect-ts/core/Sync"
import { _A } from "@effect-ts/core/Utils"
import { M } from "@effect-ts/morphic"
import { encode } from "@effect-ts/morphic/Encoder"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"

import { NotFoundError } from "@/errors"

import { makeTestData } from "./TaskContext.testdata"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"

const [decodeUser, encodeUser, encodeUsersToMap] = makeCodec(User)
const [decodeTask, encodeTask, encodeTasksToMap] = makeCodec(Task)
const [decodeList, encodeList, encodeListsToMap] = makeCodec(TaskListOrGroup)

const makeMockTaskContext = T.gen(function* ($) {
  const { lists, tasks, users } = yield* $(makeTestData)
  const usersRef = yield* $(pipe(encodeUsersToMap(users), T.chain(Ref.makeRef)))
  const tasksRef = yield* $(pipe(encodeTasksToMap(tasks), T.chain(Ref.makeRef)))
  const listsRef = yield* $(pipe(encodeListsToMap(lists), T.chain(Ref.makeRef)))

  const findUser = (id: UserId) =>
    pipe(
      usersRef.get,
      T.map((users) => O.fromNullable(users.get(id))),
      EO.chain(flow(decodeUser, EO.fromEffect))
    )

  const getUser = (id: UserId) =>
    pipe(
      findUser(id),
      T.chain(O.fold(() => T.fail(new NotFoundError("User", id.toString())), T.succeed))
    )

  const allLists = (id: UserId) =>
    pipe(
      T.struct({ user: getUser(id), lists: listsRef.get }),
      T.chain(({ lists }) =>
        pipe(
          Chunk.from(lists.values()),
          Chunk.map(decodeList),
          T.collectAll,
          T.map(
            Chunk.filter(
              (l) =>
                l.ownerId === id ||
                (TaskListOrGroup.is.TaskList(l) && l.members.some((m) => m.id === id))
            )
          )
        )
      )
    )

  const find = (id: TaskId) =>
    pipe(
      tasksRef.get,
      T.map((tasks) => O.fromNullable(tasks.get(id))),
      EO.chain(flow(decodeTask, EO.fromEffect))
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

  const addUser = (t: User) =>
    pipe(
      T.structPar({ encT: encodeUser(t), users: usersRef.get }),
      T.chain(({ encT, users }) => usersRef.set(users["|>"](Map.insert(t.id, encT))))
    )

  const del = (id: TaskId) =>
    pipe(
      T.tuple(tasksRef.get, get(id)),
      T.chain(({ tuple: [tasks] }) => tasksRef.set(tasks["|>"](Map.remove(id))))
    )

  //   const getOrder = (uid: UserId) =>
  //     pipe(
  //       getUser(uid),
  //       T.map((u) => u.order)
  //     )

  const all = (userId: UserId) =>
    pipe(
      T.struct({
        tasks: tasksRef.get,
        lists: pipe(
          allLists(userId),
          T.map(
            Chunk.filterMap((x) =>
              TaskListOrGroup.is.TaskList(x) ? O.some(x) : O.none
            )
          )
        ),
      }),
      T.chain(({ lists, tasks }) =>
        pipe(
          Chunk.from(tasks.values()),
          Chunk.filter(
            (x) =>
              // TODO: Or task is part of a List that a user is Member of ;-)
              x.createdBy === userId ||
              Chunk.find_(lists, (l) => l.id === x.listId)
                ["|>"](O.map((l) => l.members.some((m) => m.id === userId)))
                ["|>"](O.getOrElse(() => false))
          ),
          T.forEach(decodeTask)
        )
      )
    )

  return {
    allLists,
    findUser,
    getUser,
    find,
    get,
    all,
    updateUser: (id: UserId, mod: (a: User) => User) =>
      pipe(getUser(id), T.map(mod), T.chain(addUser)),
    updateUserM: <R, E>(id: UserId, mod: (a: User) => T.Effect<R, E, User>) =>
      pipe(getUser(id), T.chain(mod), T.chain(addUser)),
    update: (id: TaskId, mod: (a: Task) => Task) =>
      pipe(get(id), T.map(mod), T.chain(add)),
    updateM: <R, E>(id: TaskId, mod: (a: Task) => T.Effect<R, E, Task>) =>
      pipe(get(id), T.chain(mod), T.chain(add)),
    add,
    delete: del,
    remove: (t: Task) => del(t.id),
    //getOrder,
    setOrder: (uid: UserId, tlid: TaskListId, order: A.Array<TaskId>) =>
      tlid === "inbox"
        ? pipe(
            getUser(uid),
            T.map((u) => ({ ...u, inboxOrder: order })),
            T.chain(encodeUser),
            T.chain((u) => Ref.update_(usersRef, Map.insert(uid, u)))
          )
        : pipe(
            allLists(uid),
            T.map(Chunk.find((x) => x.id === tlid)),
            EO.map((l) => ({ ...l, order })),
            EO.chain(flow(encodeList, EO.fromEffect)),
            EO.chain((u) =>
              Ref.update_(listsRef, Map.insert(tlid as TaskListId, u))["|>"](
                EO.fromEffect
              )
            )
          ),
    // allOrdered: (userId: UserId) =>
    //   pipe(
    //     T.structPar({ tasks: all(userId), order: getOrder(userId) }),
    //     T.map(({ order, tasks }) => orderTasks(tasks["|>"](Chunk.toArray), order))
    //   ),
  }
})

export interface TaskContext extends _A<typeof makeMockTaskContext> {}
export const TaskContext = Has.tag<TaskContext>()
export const MockTaskContext = L.fromEffect(TaskContext)(makeMockTaskContext)

export const {
  add,
  all,
  allLists,
  find,
  get,
  getUser,
  remove,
  setOrder,
  update,
  updateUser,
} = T.deriveLifted(TaskContext)(
  [
    "allLists",
    "all",
    "add",
    "get",
    "getUser",
    "find",
    "remove",
    "setOrder",
    "update",
    "updateUser",
  ],
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

export function updateUserM<R, E>(id: UserId, mod: (a: User) => T.Effect<R, E, User>) {
  return T.gen(function* ($) {
    const { updateUserM } = yield* $(TaskContext)
    return updateUserM(id, mod)
  })
}

//// Helpers
// eslint-disable-next-line @typescript-eslint/ban-types
function makeCodec<E, A extends { id: Id }, Id>(t: M<{}, E, A>) {
  const { decode } = strictDecoder(t)
  const decodeOrDie = flow(decode, T.orDie)
  const encode = strictEncode(t)
  const encodeToMap = toMap(encode)
  return [decodeOrDie, encode, encodeToMap] as const
}

// eslint-disable-next-line @typescript-eslint/ban-types
function strictEncode<E, A>(t: M<{}, E, A>) {
  const { shrink } = strict(t)
  const enc = encode(t)
  return (u: A) => pipe(shrink(u), Sy.chain(enc))
}

function toMap<E, A extends { id: Id }, Id>(encode: (a: A) => Sy.UIO<E>) {
  return (a: A.Array<A>) =>
    pipe(
      A.map_(a, (task) => Sy.tuple(Sy.succeed(task.id as A["id"]), encode(task))),
      Sy.collectAll,
      Sy.map(Map.make)
    )
}
