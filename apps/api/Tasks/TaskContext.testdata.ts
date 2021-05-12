import { Membership, Step, Task, User, UserId } from "@effect-ts-demo/todo-types"
import { flow } from "@effect-ts/core/Function"
import { Lens } from "@effect-ts/monocle"

import { AUTH_DISABLED } from "@/config"

import * as O from "@effect-ts-demo/core/ext/Option"
import * as S from "@effect-ts-demo/core/ext/Schema"

// Model problems:
// - isFavorite/reminder are per Task, not per User. Probably should store per user (like myDay now is), and then merge in?
// - As ordering is currently saved per list, the ordering is shared with other users in the list. Feature?
// - Instead of an Object model, a Data model was defined..

const createUserId = S.Constructor.for(UserId)["|>"](S.unsafe)
/**
 * Create Non Empty String
 */
const createNES = S.Constructor.for(S.nonEmptyString)["|>"](S.unsafe)

function makeUserTaskCreator(u: User) {
  return flow(
    u["|>"](User.createTask_),
    Task.lens["|>"](Lens.prop("title"))["|>"](
      Lens.modify((t) => createNES(`${u.name} - ${t}`))
    )
  )
}

export function makeTestDataUnsafe() {
  // TODO: users from Auth0 / create local shadow.
  const patrick = new User({
    id: createUserId(AUTH_DISABLED ? "0" : "google-oauth2|118082603933712729435"),
    name: createNES("Patrick Roza"),
  })
  const mike = new User({
    id: createUserId("1"),
    name: createNES("Mike Arnaldi"),
  })
  const markus = new User({
    id: createUserId("2"),
    name: createNES("Markus Nomizz"),
  })

  const users = [patrick, mike, markus]

  const patrickList = patrick["|>"](User.createTaskList_)({
    title: createNES("Some Patrick List"),
  })
  const patrickSharedList = patrick["|>"](User.createTaskList_)({
    title: createNES("Patrick's shared List"),
    members: [
      new Membership({
        id: mike.id,
        name: createNES("Mike Arnaldi"),
      }),
      new Membership({
        id: markus.id,
        name: createNES("Markus Nomizz"),
      }),
    ],
  })
  const mikeSharedList = mike["|>"](User.createTaskList_)({
    title: createNES("Mike's shared List"),
    members: [
      new Membership({
        id: patrick.id,
        name: createNES("Patrick Roza"),
      }),
    ],
  })
  const markusSharedList = markus["|>"](User.createTaskList_)({
    title: createNES("Markus's shared List"),
    members: [
      new Membership({
        id: patrick.id,
        name: createNES("Patrick Roza"),
      }),
    ],
  })

  const lists = [
    patrickList,
    patrick["|>"](User.createTaskListGroup_)({
      title: createNES("Patrick - Some group"),
      lists: [patrickSharedList.id, patrickList.id],
    }),
    patrickSharedList,
    ///////
    mike["|>"](User.createTaskListGroup_)({
      title: createNES("Mike - Some group"),
      lists: [mikeSharedList.id],
    }),
    mikeSharedList,
    /////
    markusSharedList,
  ]

  const createPatrickTask = makeUserTaskCreator(patrick)
  const createMikeTask = makeUserTaskCreator(mike)
  const createMarkusTask = makeUserTaskCreator(markus)

  const tasks = [
    createPatrickTask({
      title: createNES("My first Task"),
      steps: [new Step({ title: createNES("first step") })],
    }),
    createPatrickTask({
      title: createNES("My second Task"),
    }),
    createPatrickTask({
      title: createNES("My third Task"),
      steps: [
        new Step({
          title: createNES("first step"),
          completed: true,
        }),
        new Step({ title: createNES("second step") }),
      ],
    })["|>"](Task.complete),
    createPatrickTask({
      title: createNES("My third Task"),
      steps: [
        new Step({
          title: createNES("first step"),
          completed: true,
        }),
        new Step({
          title: createNES("second step"),
        }),
      ],
      due: O.some(new Date(2021, 1, 1)),
    }),
    createPatrickTask({
      title: createNES("My third Task"),
      steps: [
        new Step({
          title: createNES("first step"),
          completed: true,
        }),
        new Step({
          title: createNES("second step"),
        }),
      ],
      due: O.some(new Date(2021, 2, 1)),
    }),

    createPatrickTask({
      title: createNES("My fourth Task"),
      steps: [
        new Step({
          title: createNES("first step"),
          completed: true,
        }),
        new Step({
          title: createNES("second step"),
        }),
      ],
      reminder: O.some(new Date(2021, 1, 1)),
    }),

    createPatrickTask({
      title: createNES("My fifth Task"),
      steps: [
        new Step({
          title: createNES("first step"),
          completed: true,
        }),
        new Step({
          title: createNES("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      due: O.some(new Date(2021, 2, 1)),
    }),
    createPatrickTask({
      title: createNES("My sixth Task"),
      steps: [
        new Step({
          title: createNES("first step"),
          completed: true,
        }),
        new Step({
          title: createNES("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      isFavorite: true,
    }),

    createPatrickTask({
      title: createNES("My seventh Task"),
      steps: [
        new Step({
          title: createNES("first step"),
          completed: true,
        }),
        new Step({
          title: createNES("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      isFavorite: true,
    }),

    createPatrickTask({
      title: createNES("My eight Task"),
      steps: [
        new Step({
          title: createNES("first step"),
          completed: true,
        }),
        new Step({
          title: createNES("second step"),
        }),
      ],
      listId: patrickSharedList.id,
    }),
    ///////
    createMikeTask({
      title: createNES("My first Task"),
      steps: [new Step({ title: createNES("first step") })],
    }),
    createMikeTask({
      title: createNES("My second Task"),
      steps: [new Step({ title: createNES("first step") })],
      listId: mikeSharedList.id,
    }),
    ///////
    createMarkusTask({
      title: createNES("My first Task"),
      steps: [new Step({ title: createNES("first step") })],
    }),
    createMarkusTask({
      title: createNES("My second Task"),
      steps: [new Step({ title: createNES("first step") })],
      listId: markusSharedList.id,
    }),
  ]

  return { lists, users, tasks }
}
