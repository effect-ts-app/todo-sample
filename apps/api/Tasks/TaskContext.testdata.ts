import {
  Membership,
  SharableTaskList,
  Step,
  Task,
  TaskListGroup,
  User,
  UserId,
} from "@effect-ts-demo/todo-types"
import * as T from "@effect-ts/core/Effect"
import { flow } from "@effect-ts/core/Function"
import { Lens } from "@effect-ts/monocle"

import { makeUuid } from "@effect-ts-demo/core/ext/Model"
import * as O from "@effect-ts-demo/core/ext/Option"
import * as S from "@effect-ts-demo/core/ext/Schema"

// Model problems:
// - isFavorite/reminder are per Task, not per User. Probably should store per user (like myDay now is), and then merge in?
// - As ordering is currently saved per list, the ordering is shared with other users in the list. Feature?
// - Instead of an Object model, a Data model was defined..
const createUID = flow(S.Constructor.for(UserId)["|>"](S.condemn))
const constructNonEmptyString = S.Constructor.for(S.nonEmptyString)
const createNonEmptyString = constructNonEmptyString["|>"](S.condemn)
const createNonEmptyStringUnsafe = constructNonEmptyString["|>"](S.unsafe)

function makeUserTaskCreator(u: User) {
  return flow(
    u["|>"](User.createTask_),
    Task.lens["|>"](Lens.prop("title"))["|>"](
      Lens.modify((t) => createNonEmptyStringUnsafe(`${u.name} - ${t}`))
    )
  )
}

export const makeTestData = T.gen(function* ($) {
  const PatricksSharedListUUid = makeUuid()
  const MikesSharedListID = makeUuid()
  const MarkusSharedListId = makeUuid()
  const groupId = makeUuid()
  const patrick = new User({
    id: yield* $(createUID(0)),
    name: yield* $(createNonEmptyString("Patrick Roza")),
  })
  const mike = new User({
    id: yield* $(createUID(1)),
    name: yield* $(createNonEmptyString("Mike Arnaldi")),
  })
  const markus = new User({
    id: yield* $(createUID(2)),
    name: yield* $(createNonEmptyString("Markus Nomizz")),
  })
  const users = [
    patrick,
    ////////
    mike,
    ////////
    markus,
  ]

  const groupedListId = makeUuid()
  const lists = [
    new SharableTaskList({
      id: groupedListId,
      ownerId: patrick.id,
      title: yield* $(createNonEmptyString("Some Patrick List")),
    }),
    ////////
    new TaskListGroup({
      id: groupId,
      ownerId: patrick.id,
      title: yield* $(createNonEmptyString("Patrick - Some group")),
      lists: [groupedListId],
    }),
    new SharableTaskList({
      id: PatricksSharedListUUid,
      ownerId: patrick.id,
      title: yield* $(createNonEmptyString("Patrick's shared List")),
      members: [
        new Membership({
          id: mike.id,
          name: yield* $(createNonEmptyString("Mike Arnaldi")),
        }),
        new Membership({
          id: markus.id,
          name: yield* $(createNonEmptyString("Markus Nomizz")),
        }),
      ],
    }),
    ///////
    new TaskListGroup({
      ownerId: mike.id,
      title: yield* $(createNonEmptyString("Mike - Some group")),
      lists: [MikesSharedListID],
    }),
    new SharableTaskList({
      id: MikesSharedListID,
      ownerId: mike.id,
      title: yield* $(createNonEmptyString("Mike's shared List")),
      members: [
        new Membership({
          id: patrick.id,
          name: yield* $(createNonEmptyString("Patrick Roza")),
        }),
      ],
    }),
    /////
    new SharableTaskList({
      id: MarkusSharedListId,
      ownerId: markus.id,
      //order: [],
      title: yield* $(createNonEmptyString("Markus's shared List")),
      members: [
        new Membership({
          id: patrick.id,
          name: yield* $(createNonEmptyString("Patrick Roza")),
        }),
      ],
    }),
  ]

  const createPatrickTask = makeUserTaskCreator(patrick)
  const createMikeTask = makeUserTaskCreator(mike)
  const createMarkusTask = makeUserTaskCreator(markus)

  const tasks = [
    createPatrickTask({
      title: yield* $(createNonEmptyString("My first Task")),
      steps: [new Step({ title: yield* $(createNonEmptyString("first step")) })],
    }),
    createPatrickTask({
      title: yield* $(createNonEmptyString("My second Task")),
    }),
    createPatrickTask({
      title: yield* $(createNonEmptyString("My third Task")),
      steps: [
        new Step({
          title: yield* $(createNonEmptyString("first step")),
          completed: true,
        }),
        new Step({ title: yield* $(createNonEmptyString("second step")) }),
      ],
    })["|>"](Task.complete),
    {
      ...createPatrickTask({
        title: yield* $(createNonEmptyString("My third Task")),
        steps: [
          new Step({
            title: yield* $(createNonEmptyString("first step")),
            completed: true,
          }),
          new Step({
            title: yield* $(createNonEmptyString("second step")),
          }),
        ],
      }),
      due: O.some(new Date(2021, 1, 1)),
    },
    {
      ...createPatrickTask({
        title: yield* $(createNonEmptyString("My third Task")),
        steps: [
          new Step({
            title: yield* $(createNonEmptyString("first step")),
            completed: true,
          }),
          new Step({
            title: yield* $(createNonEmptyString("second step")),
          }),
        ],
      }),
      due: O.some(new Date(2021, 2, 1)),
    },

    {
      ...createPatrickTask({
        title: yield* $(createNonEmptyString("My fourth Task")),
        steps: [
          new Step({
            title: yield* $(createNonEmptyString("first step")),
            completed: true,
          }),
          new Step({
            title: yield* $(createNonEmptyString("second step")),
          }),
        ],
      }),
      reminder: O.some(new Date(2021, 1, 1)),
    },

    {
      ...createPatrickTask({
        title: yield* $(createNonEmptyString("My fifth Task")),
        steps: [
          new Step({
            title: yield* $(createNonEmptyString("first step")),
            completed: true,
          }),
          new Step({
            title: yield* $(createNonEmptyString("second step")),
          }),
        ],
        listId: PatricksSharedListUUid,
      }),
      due: O.some(new Date(2021, 2, 1)),
    },

    {
      ...createPatrickTask({
        title: yield* $(createNonEmptyString("My sixth Task")),
        steps: [
          new Step({
            title: yield* $(createNonEmptyString("first step")),
            completed: true,
          }),
          new Step({
            title: yield* $(createNonEmptyString("second step")),
          }),
        ],
        listId: PatricksSharedListUUid,
      }),
      isFavorite: true,
    },

    {
      ...createPatrickTask({
        title: yield* $(createNonEmptyString("My seventh Task")),
        steps: [
          new Step({
            title: yield* $(createNonEmptyString("first step")),
            completed: true,
          }),
          new Step({
            title: yield* $(createNonEmptyString("second step")),
          }),
        ],
        listId: PatricksSharedListUUid,
      }),
      isFavorite: true,
    },

    {
      ...createPatrickTask({
        title: yield* $(createNonEmptyString("My eight Task")),
        steps: [
          new Step({
            title: yield* $(createNonEmptyString("first step")),
            completed: true,
          }),
          new Step({
            title: yield* $(createNonEmptyString("second step")),
          }),
        ],
        listId: PatricksSharedListUUid,
      }),
    },
    ///////
    createMikeTask({
      title: yield* $(createNonEmptyString("My first Task")),
      steps: [new Step({ title: yield* $(createNonEmptyString("first step")) })],
    }),
    createMikeTask({
      title: yield* $(createNonEmptyString("My second Task")),
      steps: [new Step({ title: yield* $(createNonEmptyString("first step")) })],
      listId: MikesSharedListID,
    }),
    ///////
    createMarkusTask({
      title: yield* $(createNonEmptyString("My first Task")),
      steps: [new Step({ title: yield* $(createNonEmptyString("first step")) })],
    }),
    createMarkusTask({
      title: yield* $(createNonEmptyString("My second Task")),
      steps: [new Step({ title: yield* $(createNonEmptyString("first step")) })],
      listId: MarkusSharedListId,
    }),
  ]

  return { lists, users, tasks }
})
