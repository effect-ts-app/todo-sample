import * as T from "@effect-ts-demo/core/ext/Effect"
import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { makeCodec } from "@effect-ts-demo/infra/context/schema"
import {
  Task,
  TaskListOrGroup,
  TaskListId,
  TaskId,
  UserId,
  User,
  TaskList,
  TaskListGroup,
} from "@effect-ts-demo/todo-types"
import { Has } from "@effect-ts/core"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as Map from "@effect-ts/core/Collections/Immutable/Map"
import * as L from "@effect-ts/core/Effect/Layer"
import * as Ref from "@effect-ts/core/Effect/Ref"
import { flow, identity, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { _A } from "@effect-ts/core/Utils"

import { canAccessList, canAccessTaskE } from "@/access"
import { NotFoundError } from "@/errors"

import { makeTestDataUnsafe } from "./TaskContext.testdata"

const [decodeUser, encodeUser, encodeUsersToMap] = makeCodec(User.Model)
const [decodeTask, encodeTask, encodeTasksToMap] = makeCodec(Task.Model)
const [decodeList, encodeList, encodeListsToMap] = makeCodec(TaskListOrGroup)

const makeMockTaskContext = T.gen(function* ($) {
  const { lists, tasks, users } = yield* $(T.tryCatch(makeTestDataUnsafe, identity))
  const usersRef = yield* $(pipe(encodeUsersToMap(users), T.chain(Ref.makeRef)))
  const tasksRef = yield* $(pipe(encodeTasksToMap(tasks), T.chain(Ref.makeRef)))
  const listsRef = yield* $(pipe(encodeListsToMap(lists), T.chain(Ref.makeRef)))

  const findUser = (id: UserId) =>
    pipe(
      usersRef.get,
      T.map((users) => O.fromNullable(users.get(id))),
      EO.chainEffect(decodeUser)
    )

  const getUser = (id: UserId) =>
    pipe(
      findUser(id),
      T.chain(O.fold(() => T.fail(new NotFoundError("User", id.toString())), T.succeed))
    )

  const findList = (id: TaskListId) =>
    pipe(
      listsRef.get,
      T.map((lists) => O.fromNullable(lists.get(id))),
      EO.chainEffect(decodeList)
    )

  const findTaskList = flow(
    findList,
    EO.chain((x) => (TaskList.Guard(x) ? EO.some(x) : EO.none))
  )

  const findTaskListGroup = flow(
    findList,
    EO.chain((x) => (TaskListGroup.Guard(x) ? EO.some(x) : EO.none))
  )

  const getList = (id: TaskListId) =>
    pipe(
      findList(id),
      T.chain(O.fold(() => T.fail(new NotFoundError("List", id.toString())), T.succeed))
    )

  const getTaskList = (id: TaskListId) =>
    pipe(
      findTaskList(id),
      T.chain(
        O.fold(() => T.fail(new NotFoundError("TaskList", id.toString())), T.succeed)
      )
    )

  const getTaskListGroup = (id: TaskListId) =>
    pipe(
      findTaskListGroup(id),
      T.chain(
        O.fold(
          () => T.fail(new NotFoundError("findTaskListGroup", id.toString())),
          T.succeed
        )
      )
    )

  const addList = (t: TaskListOrGroup) =>
    pipe(
      T.structPar({ encT: encodeList(t), lists: listsRef.get }),
      T.chain(({ encT, lists }) => listsRef.set(lists["|>"](Map.insert(t.id, encT))))
    )

  const allLists = (userId: UserId) =>
    pipe(
      T.struct({ user: getUser(userId), lists: listsRef.get }),
      T.chain(({ lists }) =>
        pipe(
          Chunk.from(lists.values()),
          Chunk.map(decodeList),
          T.collectAll,
          T.map(Chunk.filter(canAccessList(userId)))
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

  const deleteList = (id: TaskListId) =>
    pipe(
      T.tuple(listsRef.get, get(id)),
      T.chain(({ tuple: [lists] }) => listsRef.set(lists["|>"](Map.remove(id))))
    )

  const allTaskLists = flow(
    allLists,
    T.map(Chunk.filterMap((x) => (TaskList.Guard(x) ? O.some(x) : O.none)))
  )

  const all = (userId: UserId) =>
    pipe(
      T.struct({
        tasks: tasksRef.get,
        lists: allTaskLists(userId),
      }),
      T.chain(({ lists, tasks }) =>
        pipe(
          Chunk.from(tasks.values()),
          Chunk.filter(canAccessTaskE(lists)(userId)),
          T.forEach(decodeTask)
        )
      )
    )

  const updateUserM = <R, E>(id: UserId, mod: (a: User) => T.Effect<R, E, User>) =>
    pipe(getUser(id), T.chain(mod), T.tap(addUser))

  const updateListM = <R, E>(
    id: TaskListId,
    mod: (a: TaskListOrGroup) => T.Effect<R, E, TaskListOrGroup>
  ) => pipe(getList(id), T.chain(mod), T.tap(addList))

  const updateTaskListM = <R, E>(
    id: TaskListId,
    mod: (a: TaskList) => T.Effect<R, E, TaskList>
  ) => pipe(getTaskList(id), T.chain(mod), T.tap(addList))

  const updateTaskListGroupM = <R, E>(
    id: TaskListId,
    mod: (a: TaskListGroup) => T.Effect<R, E, TaskListGroup>
  ) => pipe(getTaskListGroup(id), T.chain(mod), T.tap(addList))

  const updateM = <R, E>(id: TaskId, mod: (a: Task) => T.Effect<R, E, Task>) =>
    pipe(get(id), T.chain(mod), T.tap(add))

  return {
    allLists,
    allTaskLists,
    findList,
    findTaskList,
    findTaskListGroup,
    getList,
    getTaskList,
    getTaskListGroup,
    findUser,
    getUser,
    find,
    get,
    all,
    updateUser: (id: UserId, mod: (a: User) => User) => updateUserM(id, T.liftM(mod)),
    updateUserM,
    updateList: (id: TaskListId, mod: (a: TaskListOrGroup) => TaskListOrGroup) =>
      updateListM(id, T.liftM(mod)),
    updateListM,
    updateTaskList: (id: TaskListId, mod: (a: TaskList) => TaskList) =>
      updateTaskListM(id, T.liftM(mod)),
    updateTaskListM,
    updateTaskListGroup: (id: TaskListId, mod: (a: TaskListGroup) => TaskListGroup) =>
      updateTaskListGroupM(id, T.liftM(mod)),
    updateTaskListGroupM,
    update: (id: TaskId, mod: (a: Task) => Task) => updateM(id, T.liftM(mod)),
    updateM,
    add,
    delete: del,
    deleteList,
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
  allTaskLists,
  deleteList,
  find,
  get,
  getList,
  getTaskList,
  getUser,
  remove,
  update,
  updateList,
  updateTaskList,
  updateTaskListGroup,
  updateUser,
} = T.deriveLifted(TaskContext)(
  [
    "allLists",
    "allTaskLists",
    "all",
    "add",
    "deleteList",
    "get",
    "getUser",
    "getList",
    "getTaskList",
    "find",
    "remove",
    "update",
    "updateList",
    "updateTaskList",
    "updateTaskListGroup",
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
    return yield* $(updateM(id, mod))
  })
}

export function updateUserM<R, E>(id: UserId, mod: (a: User) => T.Effect<R, E, User>) {
  return T.gen(function* ($) {
    const { updateUserM } = yield* $(TaskContext)
    return yield* $(updateUserM(id, mod))
  })
}

export function updateListM<R, E>(
  id: TaskListId,
  mod: (a: TaskListOrGroup) => T.Effect<R, E, TaskListOrGroup>
) {
  return T.gen(function* ($) {
    const { updateListM } = yield* $(TaskContext)
    return yield* $(updateListM(id, mod))
  })
}

export function updateTaskListM<R, E>(
  id: TaskListId,
  mod: (a: TaskList) => T.Effect<R, E, TaskList>
) {
  return T.gen(function* ($) {
    const { updateTaskListM } = yield* $(TaskContext)
    return yield* $(updateTaskListM(id, mod))
  })
}

export function updateTaskListGroupM<R, E>(
  id: TaskListId,
  mod: (a: TaskListGroup) => T.Effect<R, E, TaskListGroup>
) {
  return T.gen(function* ($) {
    const { updateTaskListGroupM } = yield* $(TaskContext)
    return yield* $(updateTaskListGroupM(id, mod))
  })
}
