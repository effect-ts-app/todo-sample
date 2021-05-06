/* eslint-disable @typescript-eslint/ban-ts-comment */
// TODO: Remove ban
import {
  Task,
  TaskId,
  TaskListIdU,
  TaskListOrGroup,
  UID,
  User,
} from "@effect-ts-demo/todo-types"
import { Has } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as Map from "@effect-ts/core/Collections/Immutable/Map"
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

import * as T from "@effect-ts-demo/core/ext/Effect"
import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { Parser, Encoder } from "@effect-ts-demo/core/ext/Schema"

const [decodeUser, encodeUser, encodeUsersToMap] = makeSchemaCodec(User.Model)
const [decodeTask, encodeTask, encodeTasksToMap] = makeCodec(Task)
const [decodeList, encodeList, encodeListsToMap] = makeCodec(TaskListOrGroup)

const makeMockTaskContext = T.gen(function* ($) {
  const { lists, tasks, users } = yield* $(makeTestData)
  const usersRef = yield* $(pipe(encodeUsersToMap(users), T.chain(Ref.makeRef)))
  const tasksRef = yield* $(pipe(encodeTasksToMap(tasks), T.chain(Ref.makeRef)))
  const listsRef = yield* $(pipe(encodeListsToMap(lists), T.chain(Ref.makeRef)))

  const findUser = (id: UID) =>
    pipe(
      usersRef.get,
      T.map((users) => O.fromNullable(users.get(id))),
      EO.chainEffect(decodeUser)
    )

  const getUser = (id: UID) =>
    pipe(
      findUser(id),
      T.chain(O.fold(() => T.fail(new NotFoundError("User", id.toString())), T.succeed))
    )

  const findList = (id: TaskListIdU) =>
    pipe(
      listsRef.get,
      T.map((lists) => O.fromNullable(lists.get(id))),
      EO.chainEffect(decodeList)
    )

  const getList = (id: TaskListIdU) =>
    pipe(
      findList(id),
      T.chain(O.fold(() => T.fail(new NotFoundError("List", id.toString())), T.succeed))
    )

  const addList = (t: TaskListOrGroup) =>
    pipe(
      T.structPar({ encT: encodeList(t), lists: listsRef.get }),
      T.chain(({ encT, lists }) => listsRef.set(lists["|>"](Map.insert(t.id, encT))))
    )

  const allLists = (id: UID) =>
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
      EO.chainEffect(decodeTask)
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

  const all = (userId: UID) =>
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
              x.createdBy === userId ||
              Chunk.find_(lists, (l) => l.id === x.listId)
                ["|>"](
                  O.map(
                    (l) =>
                      l.ownerId === userId || l.members.some((m) => m.id === userId)
                  )
                )
                ["|>"](O.getOrElse(() => false))
          ),
          T.forEach(decodeTask)
        )
      )
    )

  const updateUserM = <R, E>(id: UID, mod: (a: User) => T.Effect<R, E, User>) =>
    pipe(getUser(id), T.chain(mod), T.tap(addUser))

  const updateListM = <R, E>(
    id: TaskListIdU,
    mod: (a: TaskListOrGroup) => T.Effect<R, E, TaskListOrGroup>
  ) => pipe(getList(id), T.chain(mod), T.tap(addList))

  const updateM = <R, E>(id: TaskId, mod: (a: Task) => T.Effect<R, E, Task>) =>
    pipe(get(id), T.chain(mod), T.tap(add))

  return {
    allLists,
    findList,
    getList,
    findUser,
    getUser,
    find,
    get,
    all,
    updateUser: (id: UID, mod: (a: User) => User) => updateUserM(id, T.liftM(mod)),
    updateUserM,
    updateList: (id: TaskListIdU, mod: (a: TaskListOrGroup) => TaskListOrGroup) =>
      updateListM(id, T.liftM(mod)),
    updateListM,
    update: (id: TaskId, mod: (a: Task) => Task) => updateM(id, T.liftM(mod)),
    updateM,
    add,
    delete: del,
    remove: (t: Task) => del(t.id),
  }
})

export interface TaskContext extends _A<typeof makeMockTaskContext> {}
export const TaskContext = Has.tag<TaskContext>()
export const MockTaskContext = L.fromEffect(TaskContext)(
  makeMockTaskContext["|>"](T.orDie)
)

export const {
  add,
  all,
  allLists,
  find,
  get,
  getUser,
  remove,
  update,
  updateList,
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
    "update",
    "updateList",
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

export function updateUserM<R, E>(id: UID, mod: (a: User) => T.Effect<R, E, User>) {
  return T.gen(function* ($) {
    const { updateUserM } = yield* $(TaskContext)
    return updateUserM(id, mod)
  })
}

export function updateListM<R, E>(
  id: TaskListIdU,
  mod: (a: TaskListOrGroup) => T.Effect<R, E, TaskListOrGroup>
) {
  return T.gen(function* ($) {
    const { updateListM } = yield* $(TaskContext)
    return updateListM(id, mod)
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

function makeSchemaCodec<
  ParserInput,
  ParserError,
  ParsedShape extends { id: Id },
  ConstructorInput,
  ConstructorError,
  ConstructedShape extends ParsedShape,
  Encoded,
  Api,
  Id
>(
  self: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    ConstructedShape,
    Encoded,
    Api
  >
) {
  // TODO: strict
  const decode = flow(Parser.for(self)["|>"](S.condemn), T.orDie)
  const enc = Encoder.for(self)

  const encode = (u: ParsedShape) => Sy.succeedWith(() => enc(u))
  const encodeToMap = toMap(encode)
  return [decode, encode, encodeToMap] as const
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
