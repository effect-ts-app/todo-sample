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

// Model problems:
// - isFavorite/reminder are per Task, not per User. Probably should store per user (like myDay now is), and then merge in?
// - As ordering is currently saved per list, the ordering is shared with other users in the list. Feature?
// - Instead of an Object model, a Data model was defined..
export const makeTestData = Sy.gen(function* ($) {
  const patrickId = yield* $(UserId.parse_(0))
  const mikeId = yield* $(UserId.parse_(1))
  const markusId = yield* $(UserId.parse_(2))

  const PatricksSharedListUUid = makeUuid()
  const MikesSharedListID = makeUuid()
  const MarkusSharedListId = makeUuid()
  const groupId = makeUuid()
  const users = [
    User.create({
      id: patrickId,
      name: yield* $(NonEmptyString.decode_("Patrick Roza")),
    }),
    ////////
    User.create({
      id: mikeId,
      name: yield* $(NonEmptyString.decode_("Mike Arnaldi")),
    }),
    ////////
    User.create({
      id: markusId,
      name: yield* $(NonEmptyString.decode_("Markus Nomizz")),
    }),
  ]

  const groupedListId = makeUuid()
  const lists = [
    TaskListOrGroup.as.TaskList({
      id: groupedListId,
      ownerId: patrickId,
      title: yield* $(NonEmptyString.decode_("Some Patrick List")),
      members: [],
    }),
    ////////
    TaskListOrGroup.as.TaskListGroup({
      id: groupId,
      ownerId: patrickId,
      title: yield* $(NonEmptyString.decode_("Patrick - Some group")),
      lists: [groupedListId],
    }),
    TaskListOrVirtual.as.TaskList({
      id: PatricksSharedListUUid,
      ownerId: patrickId,
      title: yield* $(NonEmptyString.decode_("Patrick's shared List")),
      members: [
        {
          id: mikeId,
          name: yield* $(NonEmptyString.decode_("Mike Arnaldi")),
        },
        {
          id: markusId,
          name: yield* $(NonEmptyString.decode_("Markus Nomizz")),
        },
      ],
    }),
    ///////
    TaskListOrGroup.as.TaskListGroup({
      id: makeUuid(),
      ownerId: mikeId,
      title: yield* $(NonEmptyString.decode_("Mike - Some group")),
      lists: [MikesSharedListID],
    }),
    TaskListOrGroup.as.TaskList({
      id: MikesSharedListID,
      ownerId: mikeId,
      title: yield* $(NonEmptyString.decode_("Mike's shared List")),
      members: [
        {
          id: patrickId,
          name: yield* $(NonEmptyString.decode_("Patrick Roza")),
        },
      ],
    }),
    /////
    TaskListOrGroup.as.TaskList({
      id: MarkusSharedListId,
      ownerId: markusId,
      //order: [],
      title: yield* $(NonEmptyString.decode_("Markus's shared List")),
      members: [
        {
          id: patrickId,
          name: yield* $(NonEmptyString.decode_("Patrick Roza")),
        },
      ],
    }),
  ]

  const createPatrickTask = createTask(patrickId, "Patrick")
  const createMikeTask = createTask(mikeId, "Mike")
  const createMarkusTask = createTask(markusId, "Markus")

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
    },
    ///////
    createMikeTask({
      title: yield* $(NonEmptyString.decode_("My first Task")),
      steps: [Step.create({ title: yield* $(NonEmptyString.decode_("first step")) })],
    }),
    createMikeTask({
      title: yield* $(NonEmptyString.decode_("My second Task")),
      steps: [Step.create({ title: yield* $(NonEmptyString.decode_("first step")) })],
      listId: MikesSharedListID,
    }),
    ///////
    createMarkusTask({
      title: yield* $(NonEmptyString.decode_("My first Task")),
      steps: [Step.create({ title: yield* $(NonEmptyString.decode_("first step")) })],
    }),
    createMarkusTask({
      title: yield* $(NonEmptyString.decode_("My second Task")),
      steps: [Step.create({ title: yield* $(NonEmptyString.decode_("first step")) })],
      listId: MarkusSharedListId,
    }),
  ]

  return { lists, users, tasks }
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
