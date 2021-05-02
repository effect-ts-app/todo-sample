import {
  SharableTaskList,
  Step,
  Task,
  TaskId,
  TaskList,
  TaskListId,
  TaskListOrGroup,
  TaskListOrVirtual,
  User,
  UserId,
} from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Map from "@effect-ts/core/Collections/Immutable/Map"
import * as T from "@effect-ts/core/Effect"
import * as Ref from "@effect-ts/core/Effect/Ref"
import * as E from "@effect-ts/core/Either"
import { constant, flow, identity } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as Sy from "@effect-ts/core/Sync"

import { NotFoundError } from "@/errors"

import { makeUuid } from "@effect-ts-demo/core/ext/Model"
import { NonEmptyString, PositiveInt } from "@effect-ts-demo/core/ext/Model"

const unsafe = flow(
  Sy.runEither,
  E.fold(() => {
    throw new Error("Invalid data")
  }, identity)
)

// function unsafeExtend<
//   E,
//   A,
//   T extends M<{}, E, A> & Interpreter<E, A> & Interpreter<E, A>
// >(t: T) {
//   return extend(t, {
//     unsafe: flow(t.decode_, unsafe),
//   })
// }

// const NonEmptyString = unsafeExtend(NonEmptyString_)
// const PositiveInt = unsafeExtend(PositiveInt_)

// TODO: ordering of groups and taskLists..
// for now do that by joining them within a single list...

// Limitations:
// Favorite, reminder and myDay are global, so for shared tasks, it is equal across users
// Idea; Use VirtualTask, similar to VirtualTaskList ;-)
const MikesSharedListID = makeUuid()
const PatricksSharedListUUid = makeUuid()
const MarkusSharedListId = makeUuid()
const users = pipe(
  Sy.gen(function* ($) {
    return [
      User.build({
        id: yield* $(PositiveInt.decode_(1)),
        name: yield* $(NonEmptyString.decode_("Patrick Roza")),
        inbox: TaskList.build({
          id: makeUuid(),
          tasks: [
            Task.create({
              title: "Patrick first Task" as NonEmptyString,
              steps: [Step.create({ title: "first step" as NonEmptyString })],
            }),
            Task.create({ title: "Patrick second Task" as NonEmptyString, steps: [] }),
            Task.create({
              title: "Patrick third Task" as NonEmptyString,
              steps: [
                Step.build({ title: "first step" as NonEmptyString, completed: true }),
                Step.create({ title: "second step" as NonEmptyString }),
              ],
            })["|>"](Task.complete),
            {
              ...Task.create({
                title: "Patrick third Task" as NonEmptyString,
                steps: [
                  Step.build({
                    title: "first step" as NonEmptyString,
                    completed: true,
                  }),
                  Step.create({ title: "second step" as NonEmptyString }),
                ],
              }),
              due: O.some(new Date(2021, 1, 1)),
            },
            {
              ...Task.create({
                title: "Patrick fourth Task" as NonEmptyString,
                steps: [
                  Step.build({
                    title: "first step" as NonEmptyString,
                    completed: true,
                  }),
                  Step.create({ title: "second step" as NonEmptyString }),
                ],
              }),
              reminder: O.some(new Date(2021, 1, 1)),
            },
          ],
        }),
        lists: [
          TaskListOrGroup.of.TaskList({
            id: makeUuid(),
            title: yield* $(NonEmptyString.decode_("Some Patrick List")),
            members: [],
            tasks: [
              {
                ...Task.create({
                  title: "Patrick fifth Task" as NonEmptyString,
                  steps: [
                    Step.build({
                      title: "first step" as NonEmptyString,
                      completed: true,
                    }),
                    Step.create({ title: "second step" as NonEmptyString }),
                  ],
                }),
                due: O.some(new Date(2021, 2, 1)),
              },

              {
                ...Task.create({
                  title: "Patrick sixth Task" as NonEmptyString,
                  steps: [
                    Step.build({
                      title: "first step" as NonEmptyString,
                      completed: true,
                    }),
                    Step.create({ title: "second step" as NonEmptyString }),
                  ],
                }),
                isFavorite: true,
              },
            ],
          }),
          ////////
          TaskListOrGroup.of.TaskListGroup({
            id: makeUuid(),
            title: yield* $(NonEmptyString.decode_("Some group")),
            lists: [
              TaskListOrVirtual.of.TaskList({
                id: PatricksSharedListUUid,
                title: yield* $(NonEmptyString.decode_("Another Patrick List")),
                members: [
                  {
                    id: yield* $(PositiveInt.decode_(2)),
                    name: yield* $(NonEmptyString.decode_("Mike Arnaldi")),
                  },
                  {
                    id: yield* $(PositiveInt.decode_(3)),
                    name: yield* $(NonEmptyString.decode_("Markus Nomizz")),
                  },
                ],
                tasks: [
                  {
                    ...Task.create({
                      title: "Patrick seventh Task" as NonEmptyString,
                      steps: [
                        Step.build({
                          title: "first step" as NonEmptyString,
                          completed: true,
                        }),
                        Step.create({ title: "second step" as NonEmptyString }),
                      ],
                    }),
                    isFavorite: true,
                  },

                  {
                    ...Task.create({
                      title: "Patrick eight Task" as NonEmptyString,
                      steps: [
                        Step.build({
                          title: "first step" as NonEmptyString,
                          completed: true,
                        }),
                        Step.create({ title: "second step" as NonEmptyString }),
                      ],
                    }),
                    myDay: O.some(new Date()),
                  },
                ],
              }),
              TaskListOrVirtual.of.VirtualTaskList({
                id: MikesSharedListID,
              }),
            ],
          }),
          ////////
          TaskListOrGroup.of.VirtualTaskList({ id: MarkusSharedListId }),
          ////////
        ],
      }),
      ////////

      User.build({
        id: yield* $(PositiveInt.decode_(2)),
        name: yield* $(NonEmptyString.decode_("Mike Arnaldi")),
        inbox: TaskList.build({
          id: makeUuid(),
          tasks: [
            Task.create({
              title: "Mike first Task" as NonEmptyString,
              steps: [Step.create({ title: "first step" as NonEmptyString })],
            }),
            Task.create({ title: "Mike second Task" as NonEmptyString, steps: [] }),
            Task.create({
              title: "Mike third Task" as NonEmptyString,
              steps: [
                Step.build({ title: "first step" as NonEmptyString, completed: true }),
                Step.create({ title: "second step" as NonEmptyString }),
              ],
            })["|>"](Task.complete),
            {
              ...Task.create({
                title: "Mike third Task" as NonEmptyString,
                steps: [
                  Step.build({
                    title: "first step" as NonEmptyString,
                    completed: true,
                  }),
                  Step.create({ title: "second step" as NonEmptyString }),
                ],
              }),
              due: O.some(new Date(2021, 1, 1)),
            },
            {
              ...Task.create({
                title: "Mike fourth Task" as NonEmptyString,
                steps: [
                  Step.build({
                    title: "first step" as NonEmptyString,
                    completed: true,
                  }),
                  Step.create({ title: "second step" as NonEmptyString }),
                ],
              }),
              reminder: O.some(new Date(2021, 1, 1)),
            },
          ],
        }),
        lists: [
          TaskListOrGroup.of.TaskList({
            id: makeUuid(),
            title: yield* $(NonEmptyString.decode_("Some Mike List")),
            members: [],
            tasks: [
              {
                ...Task.create({
                  title: "Mike fifth Task" as NonEmptyString,
                  steps: [
                    Step.build({
                      title: "first step" as NonEmptyString,
                      completed: true,
                    }),
                    Step.create({ title: "second step" as NonEmptyString }),
                  ],
                }),
                reminder: O.some(new Date(2021, 1, 1)),
              },
            ],
          }),
          ////////
          TaskListOrGroup.of.TaskListGroup({
            id: makeUuid(),
            title: yield* $(NonEmptyString.decode_("Some group")),
            lists: [
              TaskListOrVirtual.of.TaskList({
                id: MikesSharedListID,
                title: yield* $(NonEmptyString.decode_("Another Mike List")),
                members: [
                  {
                    id: yield* $(PositiveInt.decode_(1)),
                    name: yield* $(NonEmptyString.decode_("Patrick Roza")),
                  },
                ],
                tasks: [
                  {
                    ...Task.create({
                      title: "Mike Sixth Task" as NonEmptyString,
                      steps: [
                        Step.build({
                          title: "first step" as NonEmptyString,
                          completed: true,
                        }),
                        Step.create({ title: "second step" as NonEmptyString }),
                      ],
                    }),
                    reminder: O.some(new Date(2021, 1, 1)),
                  },
                ],
              }),
            ],
          }),
          ////////
          TaskListOrGroup.of.VirtualTaskList({ id: PatricksSharedListUUid }),
          ////////
        ],
      }),
      ////////

      User.build({
        id: yield* $(PositiveInt.decode_(3)),
        name: yield* $(NonEmptyString.decode_("Markus Nomizz")),
        inbox: TaskList.build({
          id: makeUuid(),
          tasks: [
            Task.create({
              title: "Markus first Task" as NonEmptyString,
              steps: [Step.create({ title: "first step" as NonEmptyString })],
            }),
            Task.create({ title: "Markus second Task" as NonEmptyString, steps: [] }),
            Task.create({
              title: "Markus third Task" as NonEmptyString,
              steps: [
                Step.build({ title: "first step" as NonEmptyString, completed: true }),
                Step.create({ title: "second step" as NonEmptyString }),
              ],
            })["|>"](Task.complete),
            {
              ...Task.create({
                title: "Markus third Task" as NonEmptyString,
                steps: [
                  Step.build({
                    title: "first step" as NonEmptyString,
                    completed: true,
                  }),
                  Step.create({ title: "second step" as NonEmptyString }),
                ],
              }),
              due: O.some(new Date(2021, 1, 1)),
            },
            {
              ...Task.create({
                title: "Markus fourth Task" as NonEmptyString,
                steps: [
                  Step.build({
                    title: "first step" as NonEmptyString,
                    completed: true,
                  }),
                  Step.create({ title: "second step" as NonEmptyString }),
                ],
              }),
              reminder: O.some(new Date(2021, 1, 1)),
            },
          ],
        }),
        lists: [
          TaskListOrGroup.of.TaskList({
            id: makeUuid(),
            title: yield* $(NonEmptyString.decode_("Some Markus List")),
            members: [],
            tasks: [
              {
                ...Task.create({
                  title: "Markus fifth Task" as NonEmptyString,
                  steps: [
                    Step.build({
                      title: "first step" as NonEmptyString,
                      completed: true,
                    }),
                    Step.create({ title: "second step" as NonEmptyString }),
                  ],
                }),
                reminder: O.some(new Date(2021, 1, 1)),
              },
            ],
          }),
          ////////
          TaskListOrGroup.of.TaskListGroup({
            id: makeUuid(),
            title: yield* $(NonEmptyString.decode_("Some group")),
            lists: [
              TaskListOrVirtual.of.TaskList({
                id: MarkusSharedListId,
                title: yield* $(NonEmptyString.decode_("Another Markus List")),
                members: [
                  {
                    id: yield* $(PositiveInt.decode_(1)),
                    name: yield* $(NonEmptyString.decode_("Patrick Roza")),
                  },
                ],
                tasks: [
                  {
                    ...Task.create({
                      title: "Markus Sixth Task" as NonEmptyString,
                      steps: [
                        Step.build({
                          title: "first step" as NonEmptyString,
                          completed: true,
                        }),
                        Step.create({ title: "second step" as NonEmptyString }),
                      ],
                    }),
                    reminder: O.some(new Date(2021, 1, 1)),
                  },
                ],
              }),
            ],
          }),
          ////////
          TaskListOrGroup.of.VirtualTaskList({ id: PatricksSharedListUUid }),
          ////////
        ],
      }),
      ////////
    ]
  }),
  Sy.map(A.map((u) => [u.id, /*encode()*/ u] as const)),
  Sy.map(Map.make),
  Sy.map(Ref.unsafeMakeRef),
  unsafe
)

export function find(id: PositiveInt) {
  return pipe(
    users.get["|>"](T.map((users) => O.fromNullable(users.get(id))))
    //EO.chain(flow(decodeUser, EO.fromEffect, T.orDie))
  )
}

export function get(id: UserId) {
  return pipe(
    find(id),
    T.chain(O.fold(() => T.fail(new NotFoundError("User", id.toString())), T.succeed))
  )
}

const constNone = constant(O.none)

export function addTask(userId: UserId, folderId: O.Option<TaskListId>, t: Task) {
  // we have to traverse all users because of virtuallists :D
  return pipe(
    users.get,
    T.map(
      Map.map((v) =>
        User.build({
          ...v,
          inbox:
            v.id === userId && O.isNone(folderId)
              ? {
                  ...v.inbox,
                  tasks: v.inbox.tasks.concat([t]),
                }
              : v.inbox,
          lists: O.isNone(folderId)
            ? v.lists
            : v.lists.map(
                TaskListOrGroup.match({
                  TaskListGroup: (g) => ({
                    ...g,
                    lists: g.lists.map(
                      TaskListOrVirtual.match({
                        TaskList: (l) => ({
                          ...l,
                          tasks:
                            l.id === folderId.value ? l.tasks.concat([t]) : l.tasks,
                        }),
                        VirtualTaskList: (l) => l,
                      })
                    ),
                  }),
                  TaskList: (l) => ({
                    ...l,
                    tasks: l.id === folderId.value ? l.tasks.concat([t]) : l.tasks,
                  }),
                  VirtualTaskList: (l) => l,
                })
              ),
        })
      )
    ),
    T.chain(users.set)
  )
}

export function findTaskList(id: TaskListId) {
  return pipe(
    users.get,
    T.map(
      (u) =>
        O.fromNullable(
          [...u.values()]
            .reduce(
              (prev, cur) =>
                prev.concat(
                  A.filterMap_(
                    cur.lists,
                    TaskListOrGroup.match({
                      TaskListGroup: (l) =>
                        O.some(
                          A.filterMap_(l.lists, (l) =>
                            TaskListOrGroup.is.TaskList(l) ? O.some(l) : O.none
                          )
                        ),
                      TaskList: (l) => O.some([l]),
                      VirtualTaskList: constNone,
                    })
                  )["|>"](A.flatten)
                ),
              [] as SharableTaskList[]
            )
            .find((t) => t.id === id)
        ) // todo
    )
  )
}

export function findTask(taskId: TaskId) {
  return pipe(
    users.get,
    T.map((u) => {
      return A.findFirstMap_([...u.values()], (v) =>
        A.findFirst_(v.inbox.tasks, (x) => x.id === taskId)["|>"](
          O.alt(() =>
            A.findFirstMap_(
              v.lists,
              TaskListOrGroup.match({
                TaskListGroup: (l) =>
                  A.filterMap_(l.lists, (l) =>
                    TaskListOrGroup.is.TaskList(l) ? O.some(l) : O.none
                  )["|>"]((lists) =>
                    O.getFirst(
                      ...A.map_(lists, (l) =>
                        A.findFirst_(l.tasks, (x) => x.id === taskId)
                      )
                    )
                  ),
                TaskList: (l) => A.findFirst_(l.tasks, (x) => x.id === taskId),
                VirtualTaskList: constNone,
              })
            )
          )
        )
      )
    })
  )
}

export function getTaskList(id: TaskListId) {
  return pipe(
    findTaskList(id),
    T.chain(
      O.fold(() => T.fail(new NotFoundError("TaskList", id.toString())), T.succeed)
    )
  )
}

export function updateTask(taskId: TaskId, mod: (t: Task) => Task) {
  return pipe(
    users.get,
    T.map((u) =>
      A.findFirstMap_([...u.values()], (v) => {
        let found = false
        const nu = User.build({
          ...v,
          inbox: {
            ...v.inbox,
            tasks: v.inbox.tasks.map((x) => {
              if (x.id === taskId) {
                found = true
                return mod(x)
              }
              return x
            }),
          },
          lists: v.lists.map(
            TaskListOrGroup.match({
              TaskListGroup: (g) => ({
                ...g,
                lists: g.lists.map(
                  TaskListOrVirtual.match({
                    TaskList: (l) => ({
                      ...l,
                      tasks: l.tasks.map((x) => {
                        if (x.id === taskId) {
                          found = true
                          return mod(x)
                        }
                        return x
                      }),
                    }),
                    VirtualTaskList: (l) => l,
                  })
                ),
              }),
              TaskList: (l) => ({
                ...l,
                tasks: l.tasks.map((x) => {
                  if (x.id === taskId) {
                    found = true
                    return mod(x)
                  }
                  return x
                }),
              }),
              VirtualTaskList: (l) => l,
            })
          ),
        })
        return found ? O.some(nu) : O.none
      })
        ["|>"](O.map((x) => Map.insert_(u, x.id, x)))
        ["|>"](O.getOrElse(() => u))
    ),
    T.chain(users.set)
  )
}

export function deleteTask(taskId: TaskId) {
  return pipe(
    users.get,
    T.map((u) =>
      A.findFirstMap_([...u.values()], (v) => {
        let found = false
        const nu = User.build({
          ...v,
          inbox: {
            ...v.inbox,
            tasks: v.inbox.tasks.filter((x) => {
              if (x.id === taskId) {
                found = true
                return false
              }
              return true
            }),
          },
          lists: v.lists.map(
            TaskListOrGroup.match({
              TaskListGroup: (g) => ({
                ...g,
                lists: g.lists.map(
                  TaskListOrVirtual.match({
                    TaskList: (l) => ({
                      ...l,
                      tasks: l.tasks.filter((x) => {
                        if (x.id === taskId) {
                          found = true
                          return false
                        }
                        return true
                      }),
                    }),
                    VirtualTaskList: (l) => l,
                  })
                ),
              }),
              TaskList: (l) => ({
                ...l,
                tasks: l.tasks.filter((x) => {
                  if (x.id === taskId) {
                    found = true
                    return false
                  }
                  return true
                }),
              }),
              VirtualTaskList: (l) => l,
            })
          ),
        })
        return found ? O.some(nu) : O.none
      })
        ["|>"](O.map((x) => Map.insert_(u, x.id, x)))
        ["|>"](O.getOrElse(() => u))
    ),
    T.chain(users.set)
  )
}
