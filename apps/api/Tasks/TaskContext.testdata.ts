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

// Datamodel problems:
// - As groups are owned by users, the groups should store their child list ids.
//   currently it is the other way around. Have to decide if the UI will see the data the same
//   or if we hide that fact in the api.
// - As ordering is currently stored per user, users can have a different order even for shared lists
//   not sure yet if that's a bug or a feature ;-)
// - myDay/isFavorite/reminder are per Task, not per User. Probably should store per user, and then merge in.
export const makeTestData = Sy.gen(function* ($) {
  const patrickId = yield* $(UserId.parse_(0))
  const mikeId = yield* $(UserId.parse_(1))
  const markusId = yield* $(UserId.parse_(2))

  const PatricksSharedListUUid = makeUuid()
  const MikesSharedListID = makeUuid()
  const MarkusSharedListId = makeUuid()
  const groupId = makeUuid()
  const users = [
    User.build({
      id: patrickId,
      name: yield* $(NonEmptyString.decode_("Patrick Roza")),
      order: [],
    }),
    ////////
    User.build({
      id: mikeId,
      name: yield* $(NonEmptyString.decode_("Mike Arnaldi")),
      order: [],
    }),
    ////////
    User.build({
      id: markusId,
      name: yield* $(NonEmptyString.decode_("Markus Nomizz")),
      order: [],
    }),
  ]

  const lists = [
    TaskListOrGroup.as.TaskList({
      id: makeUuid(),
      ownerId: patrickId,
      title: yield* $(NonEmptyString.decode_("Some Patrick List")),
      members: [],
      parentListId: O.some(groupId),
    }),
    ////////
    TaskListOrGroup.as.TaskListGroup({
      id: groupId,
      ownerId: patrickId,
      title: yield* $(NonEmptyString.decode_("Some group")),
    }),
    TaskListOrVirtual.as.TaskList({
      id: PatricksSharedListUUid,
      ownerId: patrickId,
      parentListId: O.none,
      title: yield* $(NonEmptyString.decode_("Patrick's shared List")),
      members: [
        {
          id: mikeId,
          name: yield* $(NonEmptyString.decode_("Mike Arnaldi")),
        },
        {
          id: yield* $(UserId.decode_(3)),
          name: yield* $(NonEmptyString.decode_("Markus Nomizz")),
        },
      ],
    }),
    ///////
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
      parentListId: O.none,
    }),
    /////
    TaskListOrGroup.as.TaskList({
      id: MarkusSharedListId,
      ownerId: markusId,
      title: yield* $(NonEmptyString.decode_("Markus's shared List")),
      members: [
        {
          id: patrickId,
          name: yield* $(NonEmptyString.decode_("Patrick Roza")),
        },
      ],
      parentListId: O.none,
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
      myDay: O.some(new Date()),
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
