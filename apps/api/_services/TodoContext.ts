import { Has } from "@effect-ts/core"
import * as CNK from "@effect-ts/core/Collections/Immutable/Chunk"
import * as Map from "@effect-ts/core/Collections/Immutable/Map"
import * as L from "@effect-ts/core/Effect/Layer"
import * as Ref from "@effect-ts/core/Effect/Ref"
import { flow, identity, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { _A } from "@effect-ts/core/Utils"
import * as T from "@effect-ts-app/core/ext/Effect"
import * as EO from "@effect-ts-app/core/ext/EffectOption"
import { makeCodec } from "@effect-ts-app/infra/context/schema"
import {
  Task,
  TaskEvents,
  TaskId,
  TaskList,
  TaskListGroup,
  TaskListId,
  TaskListOrGroup,
  User,
  UserId,
} from "@effect-ts-demo/todo-types"

import { NotFoundError, NotLoggedInError } from "@/errors"
import * as ListsAccess from "@/TaskLists/_access"
import * as TasksAccess from "@/Tasks/_access"
import { handleEvents } from "@/Tasks/_events"

import { makeTestDataUnsafe } from "./TodoContext.testdata"
import * as UserSVC from "./User"

const [decodeUser, encodeUser, encodeUsersToMap] = makeCodec(User.Model)
const [decodeTask, encodeTask, encodeTasksToMap] = makeCodec(Task.Model)
const [decodeList, encodeList, encodeListsToMap] = makeCodec(TaskListOrGroup)

function makeUserContext(users: User[]) {
  return T.gen(function* ($) {
    const usersRef = yield* $(pipe(encodeUsersToMap(users), T.chain(Ref.makeRef)))
    const find = (id: UserId) =>
      pipe(
        usersRef.get,
        T.map((users) => O.fromNullable(users.get(id))),
        EO.chainEffect(decodeUser)
      )

    const get = (id: UserId) =>
      pipe(
        find(id),
        T.chain(
          O.fold(() => T.fail(new NotFoundError("User", id.toString())), T.succeed)
        )
      )

    const save = (t: User) =>
      pipe(
        T.structPar({ encT: encodeUser(t), users: usersRef.get }),
        T.chain(({ encT, users }) => usersRef.set(users["|>"](Map.insert(t.id, encT))))
      )

    const updateM = <R, E>(id: UserId, mod: (a: User) => T.Effect<R, E, User>) =>
      pipe(get(id), T.chain(mod), T.tap(save))

    return {
      find,
      get,
      save,
      updateM,
      update: (id: UserId, mod: (a: User) => User) => updateM(id, T.liftM(mod)),
    }
  })
}

function makeListContext(lists: TaskListOrGroup[]) {
  return T.gen(function* ($) {
    const listsRef = yield* $(pipe(encodeListsToMap(lists), T.chain(Ref.makeRef)))

    const find = (id: TaskListId) =>
      pipe(
        listsRef.get,
        T.map((lists) => O.fromNullable(lists.get(id))),
        EO.chainEffect(decodeList)
      )

    const findList = flow(
      find,
      EO.chain((x) => (TaskList.Guard(x) ? EO.some(x) : EO.none))
    )

    const findGroup = flow(
      find,
      EO.chain((x) => (TaskListGroup.Guard(x) ? EO.some(x) : EO.none))
    )

    const get = (id: TaskListId) =>
      pipe(
        find(id),
        T.chain(
          O.fold(
            () => T.fail(new NotFoundError("ListOrGroup", id.toString())),
            T.succeed
          )
        )
      )

    const getList = (id: TaskListId) =>
      pipe(
        findList(id),
        T.chain(
          O.fold(() => T.fail(new NotFoundError("List", id.toString())), T.succeed)
        )
      )

    const getGroup = (id: TaskListId) =>
      pipe(
        findGroup(id),
        T.chain(
          O.fold(() => T.fail(new NotFoundError("Group", id.toString())), T.succeed)
        )
      )

    const save = (t: TaskListOrGroup) =>
      pipe(
        T.structPar({ encT: encodeList(t), lists: listsRef.get }),
        T.chain(({ encT, lists }) => listsRef.set(lists["|>"](Map.insert(t.id, encT))))
      )

    const all = (userId: UserId) =>
      pipe(
        listsRef.get,
        T.chain((lists) =>
          pipe(
            CNK.from(lists.values()),
            CNK.map(decodeList),
            T.collectAll,
            T.map(CNK.filter(ListsAccess.canAccess(userId)))
          )
        )
      )

    const remove = (id: TaskListId) =>
      pipe(
        T.tuple(listsRef.get, get(id)),
        T.chain(({ tuple: [lists] }) => listsRef.set(lists["|>"](Map.remove(id))))
      )

    const allLists = flow(
      all,
      T.map(CNK.filterMap((x) => (TaskList.Guard(x) ? O.some(x) : O.none)))
    )

    const updateM = <R, E>(
      id: TaskListId,
      mod: (a: TaskListOrGroup) => T.Effect<R, E, TaskListOrGroup>
    ) => pipe(get(id), T.chain(mod), T.tap(save))

    const updateListM = <R, E>(
      id: TaskListId,
      mod: (a: TaskList) => T.Effect<R, E, TaskList>
    ) => pipe(getList(id), T.chain(mod), T.tap(save))

    const updateGroupM = <R, E>(
      id: TaskListId,
      mod: (a: TaskListGroup) => T.Effect<R, E, TaskListGroup>
    ) => pipe(getGroup(id), T.chain(mod), T.tap(save))

    return {
      all,
      allLists,
      find,
      findList,
      findGroup,
      get,
      getList,
      getGroup,

      updateM,
      updateListM,
      update: (id: TaskListId, mod: (a: TaskListOrGroup) => TaskListOrGroup) =>
        updateM(id, T.liftM(mod)),
      updateList: (id: TaskListId, mod: (a: TaskList) => TaskList) =>
        updateListM(id, T.liftM(mod)),
      updateGroup: (id: TaskListId, mod: (a: TaskListGroup) => TaskListGroup) =>
        updateGroupM(id, T.liftM(mod)),
      updateGroupM,

      remove,
    }
  })
}

function makeTaskContext(tasks: Task[]) {
  return T.gen(function* ($) {
    const tasksRef = yield* $(pipe(encodeTasksToMap(tasks), T.chain(Ref.makeRef)))

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

    const save = (t: Task, events: readonly TaskEvents[] = []) =>
      pipe(
        T.structPar({ encT: encodeTask(t), tasks: tasksRef.get }),
        T.chain(({ encT, tasks }) => tasksRef.set(tasks["|>"](Map.insert(t.id, encT)))),
        // TODO: this should span a transaction - actually all writes in a usecase should be within a transaction boundary.
        T.tap(() => handleEvents(events))
      )

    const remove = (id: TaskId) =>
      pipe(
        T.tuple(tasksRef.get, get(id)),
        T.chain(({ tuple: [tasks] }) => tasksRef.set(tasks["|>"](Map.remove(id))))
      )

    const updateM = <R, E>(id: TaskId, mod: (a: Task) => T.Effect<R, E, Task>) =>
      pipe(get(id), T.chain(mod), T.tap(save))

    const all = (userId: UserId, lists: CNK.Chunk<TaskList>) =>
      pipe(
        tasksRef.get,
        T.chain((tasks) =>
          pipe(
            CNK.from(tasks.values()),
            CNK.filter(TasksAccess.canAccessE(lists)(userId)),
            T.forEach(decodeTask)
          )
        )
      )

    return {
      all,
      find,
      get,
      update: (id: TaskId, mod: (a: Task) => Task) => updateM(id, T.liftM(mod)),
      updateM,
      save,
      remove,
    }
  })
}

// TODO: Consider ListsOrGroups + Lists, Groups

const makeMockTodoContext = T.gen(function* ($) {
  const testData = yield* $(T.tryCatch(makeTestDataUnsafe, identity))

  const Users = yield* $(makeUserContext(testData.users))
  const Lists = yield* $(makeListContext(testData.lists))
  const Tasks = yield* $(makeTaskContext(testData.tasks))

  const allTasks = (userId: UserId) =>
    pipe(
      Lists.allLists(userId),
      T.chain((lists) => Tasks.all(userId, lists))
    )

  return {
    Users,
    Lists,
    Tasks,
    allTasks,
  }
})

export interface TodoContext extends _A<typeof makeMockTodoContext> {}
export const TodoContext = Has.tag<TodoContext>()
export const MockTodoContext = L.fromEffect(TodoContext)(
  makeMockTodoContext["|>"](T.orDie)
)

export const { Lists, Tasks, Users } = T.deriveLifted(TodoContext)(
  [],
  [],
  ["Lists", "Tasks", "Users"]
)

export const allTasks = (userId: UserId) =>
  T.gen(function* ($) {
    const { Lists, Tasks } = yield* $(TodoContext)
    const lists = yield* $(Lists.allLists(userId))
    return yield* $(Tasks.all(userId, lists))
  })

export const getLoggedInUser = T.gen(function* ($) {
  const user = yield* $(UserSVC.UserProfile)
  const { get } = yield* $(Users)
  return yield* $(
    pipe(
      get(user.id),
      T.catch("_tag", "NotFoundError", () => T.fail(new NotLoggedInError()))
    )
  )
})
