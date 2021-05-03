import {
  Step,
  Task,
  TaskListOrGroup,
  TaskListOrVirtual,
  User,
  UserId,
} from "@effect-ts-demo/todo-types"
import { pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as Sy from "@effect-ts/core/Sync"

import { makeUuid, NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import { unsafe } from "@effect-ts-demo/core/ext/utils"

export const makeTestData = Sy.gen(function* ($) {
  const patrickId = yield* $(UserId.parse_(0))
  // const mikeId = yield* $(UserId.parse_(1))
  // const markusId = yield* $(UserId.parse_(2))
  // todo; or via user["|>"](User.createTask(..))

  const PatricksSharedListUUid = makeUuid()
  // const MikesSharedListID = makeUuid()
  // const MarkusSharedListId = makeUuid()
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

  const createPatrickTask = createTask(patrickId, "Patrick")
  // const createMikeTask = createTask(mikeId, "Mike")
  // const createMarkusTask = createTask(markusId, "Markus")

  const tasks = [
    createPatrickTask({
      title: yield* $(NonEmptyString.decode_("My first Task")),
      steps: [Step.create({ title: yield* $(NonEmptyString.decode_("first step")) })],
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

  return { users, tasks }
})

function createTask(id: UserId, name: string) {
  return (a: Omit<Parameters<typeof Task.create>[0], "createdBy">) =>
    pipe(
      Sy.gen(function* ($) {
        return Task.create({
          ...a,
          title: yield* $(NonEmptyString.decode_(`${name} - ${a.title}`)),
          createdBy: id,
        })
      }),
      unsafe
    )
}
