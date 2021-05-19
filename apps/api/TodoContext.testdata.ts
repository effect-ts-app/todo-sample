import * as O from "@effect-ts-app/core/ext/Option"
import * as S from "@effect-ts-app/core/ext/Schema"
import { Membership, Step, Task, User, UserId } from "@effect-ts-demo/todo-types"
import { flow } from "@effect-ts/core/Function"
import { Lens } from "@effect-ts/monocle"

import { AUTH_DISABLED } from "@/config"

// Model problems:
// - isFavorite/reminder are per Task, not per User. Probably should store per user (like myDay now is), and then merge in?
// - As ordering is currently saved per list, the ordering is shared with other users in the list. Feature?
// - Instead of an Object model, a Data model was defined..

const createUserId = S.Constructor.for(UserId)["|>"](S.unsafe)
const createRS = S.Constructor.for(S.reasonableString)["|>"](S.unsafe)
const createEmail = S.Constructor.for(S.Email)["|>"](S.unsafe)
const createPhoneNumber = S.Constructor.for(S.PhoneNumber)["|>"](S.unsafe)

function makeUserTaskCreator(u: User) {
  return flow(
    User.createTask(u),
    Task.lens["|>"](Lens.prop("title"))["|>"](
      Lens.modify((t) => createRS(`${u.name} - ${t}`))
    )
  )
}

export function makeTestDataUnsafe() {
  // TODO: users from Auth0 / create local shadow.
  const patrick = new User({
    id: createUserId(AUTH_DISABLED ? "0" : "google-oauth2|118082603933712729435"),
    name: createRS("Patrick Roza"),
    email: createEmail("somewhere@someplace.com"),
    phoneNumber: createPhoneNumber("+49 1234567"),
  })
  const mike = new User({
    id: createUserId("1"),
    name: createRS("Mike Arnaldi"),
    email: createEmail("somewhere@someplace.com"),
    phoneNumber: createPhoneNumber("+49 1234567"),
  })
  const markus = new User({
    id: createUserId("2"),
    name: createRS("Markus Nomizz"),
    email: createEmail("somewhere@someplace.com"),
    phoneNumber: createPhoneNumber("+49 1234567"),
  })

  const users = [patrick, mike, markus]

  const createPatrickList = User.createTaskList(patrick)
  const patrickList = createPatrickList({
    title: createRS("Some Patrick List"),
  })
  const patrickSharedList = createPatrickList({
    title: createRS("Patrick's shared List"),
    members: [Membership.fromUser(mike), Membership.fromUser(markus)],
  })

  const mikeSharedList = User.createTaskList_(mike, {
    title: createRS("Mike's shared List"),
    members: [Membership.fromUser(patrick)],
  })

  const markusSharedList = User.createTaskList_(markus, {
    title: createRS("Markus's shared List"),
    members: [Membership.fromUser(patrick)],
  })

  const lists = [
    patrickList,
    User.createTaskListGroup_(patrick, {
      title: createRS("Patrick - Some group"),
      lists: [patrickSharedList.id, patrickList.id],
    }),
    patrickSharedList,
    ///////
    User.createTaskListGroup_(mike, {
      title: createRS("Mike - Some group"),
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
      title: createRS("My first Task"),
      steps: [new Step({ title: createRS("first step") })],
    }),
    createPatrickTask({
      title: createRS("My second Task"),
    }),
    createPatrickTask({
      title: createRS("My third Task"),
      steps: [
        new Step({
          title: createRS("first step"),
          completed: true,
        }),
        new Step({ title: createRS("second step") }),
      ],
    })["|>"](Task.complete),
    createPatrickTask({
      title: createRS("My third Task"),
      steps: [
        new Step({
          title: createRS("first step"),
          completed: true,
        }),
        new Step({
          title: createRS("second step"),
        }),
      ],
      due: O.some(new Date(2021, 1, 1)),
    }),
    createPatrickTask({
      title: createRS("My third Task"),
      steps: [
        new Step({
          title: createRS("first step"),
          completed: true,
        }),
        new Step({
          title: createRS("second step"),
        }),
      ],
      due: O.some(new Date(2021, 2, 1)),
    }),

    createPatrickTask({
      title: createRS("My fourth Task"),
      steps: [
        new Step({
          title: createRS("first step"),
          completed: true,
        }),
        new Step({
          title: createRS("second step"),
        }),
      ],
      reminder: O.some(new Date(2021, 1, 1)),
    }),

    createPatrickTask({
      title: createRS("My fifth Task"),
      steps: [
        new Step({
          title: createRS("first step"),
          completed: true,
        }),
        new Step({
          title: createRS("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      due: O.some(new Date(2021, 2, 1)),
    }),
    createPatrickTask({
      title: createRS("My sixth Task"),
      steps: [
        new Step({
          title: createRS("first step"),
          completed: true,
        }),
        new Step({
          title: createRS("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      isFavorite: true,
    }),

    createPatrickTask({
      title: createRS("My seventh Task"),
      steps: [
        new Step({
          title: createRS("first step"),
          completed: true,
        }),
        new Step({
          title: createRS("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      isFavorite: true,
    }),

    createPatrickTask({
      title: createRS("My eight Task"),
      steps: [
        new Step({
          title: createRS("first step"),
          completed: true,
        }),
        new Step({
          title: createRS("second step"),
        }),
      ],
      listId: patrickSharedList.id,
    }),
    ///////
    createMikeTask({
      title: createRS("My first Task"),
      steps: [new Step({ title: createRS("first step") })],
    }),
    createMikeTask({
      title: createRS("My second Task"),
      steps: [new Step({ title: createRS("first step") })],
      listId: mikeSharedList.id,
    }),
    ///////
    createMarkusTask({
      title: createRS("My first Task"),
      steps: [new Step({ title: createRS("first step") })],
    }),
    createMarkusTask({
      title: createRS("My second Task"),
      steps: [new Step({ title: createRS("first step") })],
      listId: markusSharedList.id,
    }),
  ]

  return { lists, users, tasks }
}
