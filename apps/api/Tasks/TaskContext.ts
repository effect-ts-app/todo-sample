import {
  Step,
  Task,
  TaskId,
  TaskListOrGroup,
  TaskListOrVirtual,
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
import { Ord } from "@effect-ts/core/Ord"
import * as Sy from "@effect-ts/core/Sync"
import { _A } from "@effect-ts/core/Utils"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { encode } from "@effect-ts/morphic/Encoder"
import { strict } from "@effect-ts/morphic/Strict"
import { strictDecoder } from "@effect-ts/morphic/StrictDecoder"

import { NotFoundError } from "@/errors"

import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { makeUuid, NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import { unsafe } from "@effect-ts-demo/core/ext/utils"

const encodeTask = flow(strict(Task).shrink, Sy.chain(encode(Task)))

const patrickId = UserId.parse_(0)["|>"](unsafe)
// const mikeId = UserId.parse_(1)["|>"](unsafe)
// const markusId = UserId.parse_(2)["|>"](unsafe)
// todo; or via user["|>"](User.createTask(..))

const makeMockTaskContext = T.gen(function* ($) {
  const PatricksSharedListUUid = makeUuid()
  // const MikesSharedListID = makeUuid()
  // const MarkusSharedListId = makeUuid()

  const usersRef = yield* $(
    pipe(
      Sy.gen(function* ($) {
        const groupId = makeUuid()
        const users = [
          User.build({
            id: patrickId,
            name: yield* $(NonEmptyString.decode_("Patrick Roza")),
            // inbox: TaskList.build({
            //   id: makeUuid(),
            // }),
            order: [],
            lists: [
              TaskListOrGroup.as.TaskList({
                id: makeUuid(),
                title: yield* $(NonEmptyString.decode_("Some Patrick List")),
                members: [],
                parentListId: O.none,
              }),
              ////////
              TaskListOrGroup.as.TaskListGroup({
                id: groupId,
                title: yield* $(NonEmptyString.decode_("Some group")),
              }),
              TaskListOrVirtual.as.TaskList({
                id: PatricksSharedListUUid,
                parentListId: O.some(groupId),
                title: yield* $(NonEmptyString.decode_("Another Patrick List")),
                members: [
                  {
                    id: yield* $(UserId.decode_(2)),
                    name: yield* $(NonEmptyString.decode_("Mike Arnaldi")),
                  },
                  {
                    id: yield* $(UserId.decode_(3)),
                    name: yield* $(NonEmptyString.decode_("Markus Nomizz")),
                  },
                ],
              }),
              //   TaskListOrVirtual.of.VirtualTaskList({
              //     id: MikesSharedListID,
              //   }),
              ////////
              //TaskListOrGroup.of.VirtualTaskList({ id: MarkusSharedListId }),
              ////////
            ],
          }),
        ]
        return users
      }),
      Sy.map(A.map((u) => [u.id, /*encode()*/ u] as const)),
      Sy.map(Map.make),
      T.chain(Ref.makeRef)
    )
  )

  const { decode: decodeTask } = strictDecoder(Task)
  const createPatrickTask = createTask(patrickId, "Patrick")
  // const createMikeTask = createTask(mikeId, "Mike")
  // const createMarkusTask = createTask(markusId, "Markus")

  const tasksRef = yield* $(
    pipe(
      Sy.gen(function* ($) {
        const tasks = [
          createPatrickTask({
            title: yield* $(NonEmptyString.decode_("My first Task")),
            steps: [
              Step.create({ title: yield* $(NonEmptyString.decode_("first step")) }),
            ],
          }),
          createPatrickTask({
            title: yield* $(NonEmptyString.decode_("My second Task")),
            steps: [],
          }),
          createPatrickTask({
            title: yield* $(NonEmptyString.decode_("My third Task")),
            steps: [
              Step.build({
                title: yield* $(NonEmptyString.decode_("first step")),
                completed: true,
              }),
              Step.create({ title: yield* $(NonEmptyString.decode_("second step")) }),
            ],
          })["|>"](Task.complete),
          {
            ...createPatrickTask({
              title: yield* $(NonEmptyString.decode_("My third Task")),
              steps: [
                Step.build({
                  title: yield* $(NonEmptyString.decode_("first step")),
                  completed: true,
                }),
                Step.create({
                  title: yield* $(NonEmptyString.decode_("second step")),
                }),
              ],
            }),
            due: O.some(new Date(2021, 1, 1)),
          },
          {
            ...createPatrickTask({
              title: yield* $(NonEmptyString.decode_("My third Task")),
              steps: [
                Step.build({
                  title: yield* $(NonEmptyString.decode_("first step")),
                  completed: true,
                }),
                Step.create({
                  title: yield* $(NonEmptyString.decode_("second step")),
                }),
              ],
            }),
            due: O.some(new Date(2021, 2, 1)),
          },

          {
            ...createPatrickTask({
              title: yield* $(NonEmptyString.decode_("My fourth Task")),
              steps: [
                Step.build({
                  title: yield* $(NonEmptyString.decode_("first step")),
                  completed: true,
                }),
                Step.create({
                  title: yield* $(NonEmptyString.decode_("second step")),
                }),
              ],
            }),
            reminder: O.some(new Date(2021, 1, 1)),
          },

          {
            ...createPatrickTask({
              title: yield* $(NonEmptyString.decode_("My fifth Task")),
              steps: [
                Step.build({
                  title: yield* $(NonEmptyString.decode_("first step")),
                  completed: true,
                }),
                Step.create({
                  title: yield* $(NonEmptyString.decode_("second step")),
                }),
              ],
              listId: PatricksSharedListUUid,
            }),
            due: O.some(new Date(2021, 2, 1)),
          },

          {
            ...createPatrickTask({
              title: yield* $(NonEmptyString.decode_("My sixth Task")),
              steps: [
                Step.build({
                  title: yield* $(NonEmptyString.decode_("first step")),
                  completed: true,
                }),
                Step.create({
                  title: yield* $(NonEmptyString.decode_("second step")),
                }),
              ],
              listId: PatricksSharedListUUid,
            }),
            isFavorite: true,
          },

          {
            ...createPatrickTask({
              title: yield* $(NonEmptyString.decode_("My seventh Task")),
              steps: [
                Step.build({
                  title: yield* $(NonEmptyString.decode_("first step")),
                  completed: true,
                }),
                Step.create({
                  title: yield* $(NonEmptyString.decode_("second step")),
                }),
              ],
              listId: PatricksSharedListUUid,
            }),
            isFavorite: true,
          },

          {
            ...createPatrickTask({
              title: yield* $(NonEmptyString.decode_("My eight Task")),
              steps: [
                Step.build({
                  title: yield* $(NonEmptyString.decode_("first step")),
                  completed: true,
                }),
                Step.create({
                  title: yield* $(NonEmptyString.decode_("second step")),
                }),
              ],
              listId: PatricksSharedListUUid,
            }),
            myDay: O.some(new Date()),
          },
        ]
        return tasks
      }),
      Sy.chain(
        flow(
          A.map((task) => Sy.tuple(Sy.succeed(task.id), encodeTask(task))),
          Sy.collectAll,
          Sy.map(Map.make)
        )
      ),
      T.chain(Ref.makeRef)
    )
  )

  const svc = {
    findUser(id: UserId) {
      return pipe(
        usersRef.get["|>"](T.map((users) => O.fromNullable(users.get(id))))
        //EO.chain(flow(decodeUser, EO.fromEffect, T.orDie))
      )
    },

    getUser(id: UserId) {
      return pipe(
        svc.findUser(id),
        T.chain(
          O.fold(() => T.fail(new NotFoundError("User", id.toString())), T.succeed)
        )
      )
    },

    find(id: TaskId) {
      return pipe(
        tasksRef.get["|>"](T.map((tasks) => O.fromNullable(tasks.get(id)))),
        EO.chain(flow(decodeTask, EO.fromEffect, T.orDie))
      )
    },

    get(id: TaskId) {
      return pipe(
        svc.find(id),
        T.chain(O.fold(() => T.fail(new NotFoundError("Task", id)), T.succeed))
      )
    },

    all(userId: UserId) {
      return pipe(
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
    },

    add(t: Task) {
      return pipe(
        T.structPar({ encT: encodeTask(t), tasks: tasksRef.get }),
        T.chain(({ encT, tasks }) => tasksRef.set(tasks["|>"](Map.insert(t.id, encT))))
      )
    },

    remove(t: Task) {
      return tasksRef.get["|>"](
        T.chain((tasks) => tasksRef.set(tasks["|>"](Map.remove(t.id))))
      )
    },

    getOrder(uid: UserId) {
      return svc.getUser(uid)["|>"](T.map((u) => u.order))
    },
    setOrder(uid: UserId, order: A.Array<TaskId>) {
      return svc
        .getUser(uid)
        ["|>"](T.map((u) => ({ ...u, order })))
        ["|>"](T.chain((u) => Ref.update_(usersRef, Map.insert(u.id, u))))
    },

    allOrdered(userId: UserId) {
      return pipe(
        T.structPar({ tasks: svc.all(userId), order: svc.getOrder(userId) }),
        T.map(({ order, tasks }) => orderTasks(tasks["|>"](Chunk.toArray), order))
      )
    },
  }

  return svc
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

export const { add, allOrdered, find, get, getUser, remove, setOrder } = T.deriveLifted(
  TaskContext
)(["add", "get", "getUser", "find", "remove", "allOrdered", "setOrder"], [], [])

export const MockTaskContext = L.fromEffect(TaskContext)(makeMockTaskContext)

function createTask(id: UserId, name: string) {
  return (a: Omit<Parameters<typeof Task.create>[0], "createdBy">) =>
    Sy.gen(function* ($) {
      return Task.create({
        ...a,
        title: yield* $(NonEmptyString.decode_(`${name} - ${a.title}`)),
        createdBy: id,
      })
    })["|>"](unsafe)
}
