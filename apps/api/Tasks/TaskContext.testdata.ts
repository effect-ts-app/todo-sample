import {
  Membership,
  SharableTaskList,
  Step,
  Task,
  TaskListGroup,
  UserId,
  User,
  UserId,
} from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import { flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as Sy from "@effect-ts/core/Sync"

import { makeUuid, NonEmptyString, PositiveInt } from "@effect-ts-demo/core/ext/Model"
import * as S from "@effect-ts-demo/core/ext/Schema"
import { unsafe } from "@effect-ts-demo/core/ext/utils"

// Model problems:
// - isFavorite/reminder are per Task, not per User. Probably should store per user (like myDay now is), and then merge in?
// - As ordering is currently saved per list, the ordering is shared with other users in the list. Feature?
// - Instead of an Object model, a Data model was defined..
const createUID = flow(
  S.Constructor.for(UserId)["|>"](S.condemn),
  T.map((n) => n as PositiveInt & UserId) // workaround for legacy interop
)
const createNonEmptyString = S.Constructor.for(S.nonEmptyString)["|>"](S.condemn)

export const makeTestData = T.gen(function* ($) {
  const patrickId = yield* $(createUID(0))
  const mikeId = yield* $(createUID(1))
  const markusId = yield* $(createUID(2))

  const PatricksSharedListUUid = makeUuid()
  const MikesSharedListID = makeUuid()
  const MarkusSharedListId = makeUuid()
  const groupId = makeUuid()
  const users = [
    new User({
      id: patrickId,
      name: yield* $(createNonEmptyString("Patrick Roza")),
    }),
    ////////
    new User({
      id: mikeId,
      name: yield* $(createNonEmptyString("Mike Arnaldi")),
    }),
    ////////
    new User({
      id: markusId,
      name: yield* $(createNonEmptyString("Markus Nomizz")),
    }),
  ]

  const groupedListId = makeUuid()
  const lists = [
    new SharableTaskList({
      id: groupedListId,
      ownerId: patrickId,
      title: yield* $(NonEmptyString.decode_("Some Patrick List")),
    }),
    ////////
    new TaskListGroup({
      id: groupId,
      ownerId: patrickId,
      title: yield* $(NonEmptyString.decode_("Patrick - Some group")),
      lists: [groupedListId],
    }),
    new SharableTaskList({
      id: PatricksSharedListUUid,
      ownerId: patrickId,
      title: yield* $(NonEmptyString.decode_("Patrick's shared List")),
      members: [
        new Membership({
          id: mikeId,
          name: yield* $(NonEmptyString.decode_("Mike Arnaldi")),
        }),
        new Membership({
          id: markusId,
          name: yield* $(NonEmptyString.decode_("Markus Nomizz")),
        }),
      ],
    }),
    ///////
    new TaskListGroup({
      ownerId: mikeId,
      title: yield* $(NonEmptyString.decode_("Mike - Some group")),
      lists: [MikesSharedListID],
    }),
    new SharableTaskList({
      id: MikesSharedListID,
      ownerId: mikeId,
      title: yield* $(NonEmptyString.decode_("Mike's shared List")),
      members: [
        new Membership({
          id: patrickId,
          name: yield* $(NonEmptyString.decode_("Patrick Roza")),
        }),
      ],
    }),
    /////
    new SharableTaskList({
      id: MarkusSharedListId,
      ownerId: markusId,
      //order: [],
      title: yield* $(NonEmptyString.decode_("Markus's shared List")),
      members: [
        new Membership({
          id: patrickId,
          name: yield* $(NonEmptyString.decode_("Patrick Roza")),
        }),
      ],
    }),
  ]

  const createPatrickTask = createTask(patrickId, "Patrick")
  const createMikeTask = createTask(mikeId, "Mike")
  const createMarkusTask = createTask(markusId, "Markus")

  const tasks = [
    createPatrickTask({
      title: yield* $(NonEmptyString.decode_("My first Task")),
      steps: [new Step({ title: yield* $(NonEmptyString.decode_("first step")) })],
    }),
    createPatrickTask({
      title: yield* $(NonEmptyString.decode_("My second Task")),
    }),
    createPatrickTask({
      title: yield* $(NonEmptyString.decode_("My third Task")),
      steps: [
        new Step({
          title: yield* $(NonEmptyString.decode_("first step")),
          completed: true,
        }),
        new Step({ title: yield* $(NonEmptyString.decode_("second step")) }),
      ],
    })["|>"](Task.complete),
    {
      ...createPatrickTask({
        title: yield* $(NonEmptyString.decode_("My third Task")),
        steps: [
          new Step({
            title: yield* $(NonEmptyString.decode_("first step")),
            completed: true,
          }),
          new Step({
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
          new Step({
            title: yield* $(NonEmptyString.decode_("first step")),
            completed: true,
          }),
          new Step({
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
          new Step({
            title: yield* $(NonEmptyString.decode_("first step")),
            completed: true,
          }),
          new Step({
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
          new Step({
            title: yield* $(NonEmptyString.decode_("first step")),
            completed: true,
          }),
          new Step({
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
          new Step({
            title: yield* $(NonEmptyString.decode_("first step")),
            completed: true,
          }),
          new Step({
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
          new Step({
            title: yield* $(NonEmptyString.decode_("first step")),
            completed: true,
          }),
          new Step({
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
          new Step({
            title: yield* $(NonEmptyString.decode_("first step")),
            completed: true,
          }),
          new Step({
            title: yield* $(NonEmptyString.decode_("second step")),
          }),
        ],
        listId: PatricksSharedListUUid,
      }),
    },
    ///////
    createMikeTask({
      title: yield* $(NonEmptyString.decode_("My first Task")),
      steps: [new Step({ title: yield* $(NonEmptyString.decode_("first step")) })],
    }),
    createMikeTask({
      title: yield* $(NonEmptyString.decode_("My second Task")),
      steps: [new Step({ title: yield* $(NonEmptyString.decode_("first step")) })],
      listId: MikesSharedListID,
    }),
    ///////
    createMarkusTask({
      title: yield* $(NonEmptyString.decode_("My first Task")),
      steps: [new Step({ title: yield* $(NonEmptyString.decode_("first step")) })],
    }),
    createMarkusTask({
      title: yield* $(NonEmptyString.decode_("My second Task")),
      steps: [new Step({ title: yield* $(NonEmptyString.decode_("first step")) })],
      listId: MarkusSharedListId,
    }),
  ]

  return { lists, users, tasks }
})

function createTask(id: UserId, name: string) {
  return (a: Omit<ConstructorParameters<typeof Task>[0], "createdBy">) =>
    pipe(
      Sy.gen(function* ($) {
        return new Task({
          ...a,
          title: yield* $(NonEmptyString.decode_(`${name} - ${a.title}`)),
          createdBy: id,
        })
      }),
      unsafe
    )
}
