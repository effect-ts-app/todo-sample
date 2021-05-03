import {
  Step,
  Task,
  TaskE,
  TaskId,
  TaskListOrGroup,
  TaskListOrVirtual,
  User,
  UserId,
} from "@effect-ts-demo/todo-types"
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
import { makeUuid, NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import { unsafe } from "@effect-ts-demo/core/ext/utils"

const encodeTask = flow(strict(Task).shrink, Sy.chain(encode(Task)))
const runEncodeTask = flow(encodeTask, Sy.run)

const patrickId = UserId.parse_(0)["|>"](unsafe)
// const mikeId = UserId.parse_(1)["|>"](unsafe)
// const markusId = UserId.parse_(2)["|>"](unsafe)
// todo; or via user["|>"](User.createTask(..))

function createTask(id: UserId, name: string) {
  return (a: Omit<Parameters<typeof Task.create>[0], "createdBy">) =>
    Task.create({
      ...a,
      title: `${name} - ${a.title}` as NonEmptyString,
      createdBy: id,
    })
}

const PatricksSharedListUUid = makeUuid()
// const MikesSharedListID = makeUuid()
// const MarkusSharedListId = makeUuid()

const users = pipe(
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
  Sy.map(Ref.unsafeMakeRef),
  unsafe
)

export function findUser(id: UserId) {
  return pipe(
    users.get["|>"](T.map((users) => O.fromNullable(users.get(id))))
    //EO.chain(flow(decodeUser, EO.fromEffect, T.orDie))
  )
}

export function getUser(id: UserId) {
  return pipe(
    findUser(id),
    T.chain(O.fold(() => T.fail(new NotFoundError("User", id.toString())), T.succeed))
  )
}

const createPatrickTask = createTask(patrickId, "Patrick")
// const createMikeTask = createTask(mikeId, "Mike")
// const createMarkusTask = createTask(markusId, "Markus")

const tasksRef = Ref.unsafeMakeRef<Map.Map<UUID, TaskE>>(
  pipe(
    [
      createPatrickTask({
        title: "My first Task" as NonEmptyString,
        steps: [Step.create({ title: "first step" as NonEmptyString })],
      }),
      createPatrickTask({ title: "My second Task" as NonEmptyString, steps: [] }),
      createPatrickTask({
        title: "My third Task" as NonEmptyString,
        steps: [
          Step.build({ title: "first step" as NonEmptyString, completed: true }),
          Step.create({ title: "second step" as NonEmptyString }),
        ],
      })["|>"](Task.complete),
      {
        ...createPatrickTask({
          title: "My third Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
        }),
        due: O.some(new Date(2021, 1, 1)),
      },
      {
        ...createPatrickTask({
          title: "My third Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
        }),
        due: O.some(new Date(2021, 2, 1)),
      },

      {
        ...createPatrickTask({
          title: "My fourth Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
        }),
        reminder: O.some(new Date(2021, 1, 1)),
      },

      {
        ...createPatrickTask({
          title: "My fifth Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
          listId: PatricksSharedListUUid,
        }),
        due: O.some(new Date(2021, 2, 1)),
      },

      {
        ...createPatrickTask({
          title: "My sixth Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
          listId: PatricksSharedListUUid,
        }),
        isFavorite: true,
      },

      {
        ...createPatrickTask({
          title: "My seventh Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
          listId: PatricksSharedListUUid,
        }),
        isFavorite: true,
      },

      {
        ...createPatrickTask({
          title: "My eight Task" as NonEmptyString,
          steps: [
            Step.build({ title: "first step" as NonEmptyString, completed: true }),
            Step.create({ title: "second step" as NonEmptyString }),
          ],
          listId: PatricksSharedListUUid,
        }),
        myDay: O.some(new Date()),
      },
    ],
    A.map((task) => [task.id, runEncodeTask(task)] as const),
    Map.make
  )
)

const { decode: decodeTask } = strictDecoder(Task)
export function find(id: TaskId) {
  return pipe(
    tasksRef.get["|>"](T.map((tasks) => O.fromNullable(tasks.get(id)))),
    EO.chain(flow(decodeTask, EO.fromEffect, T.orDie))
  )
}

export function get(id: TaskId) {
  return pipe(
    find(id),
    T.chain(O.fold(() => T.fail(new NotFoundError("Task", id)), T.succeed))
  )
}

export function all(userId: UserId) {
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
}

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

export const getOrder = (uid: UserId) => getUser(uid)["|>"](T.map((u) => u.order))
export const setOrder = (uid: UserId, order: A.Array<TaskId>) =>
  getUser(uid)
    ["|>"](T.map((u) => ({ ...u, order })))
    ["|>"](T.chain((u) => Ref.update_(users, Map.insert(u.id, u))))

export function allOrdered(userId: UserId) {
  return pipe(
    T.structPar({ tasks: all(userId), order: getOrder(userId) }),
    T.map(({ order, tasks }) => orderTasks(tasks["|>"](Chunk.toArray), order))
  )
}

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
