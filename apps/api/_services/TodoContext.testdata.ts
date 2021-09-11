// NOTE: Instead of an Object model, a Data model was defined..

import { flow } from "@effect-ts/core/Function"
import { Lens } from "@effect-ts/monocle"
import * as O from "@effect-ts-app/core/Option"
import { Membership, Step, Task, User } from "@effect-ts-demo/todo-types"

import { Config } from "./Config"

function makeUserTaskCreator(u: User) {
  return flow(
    User.createTask.r(u),
    Task.lenses.title["|>"](
      Lens.modify((t) => ReasonableString.unsafe(`${u.name} - ${t}`))
    )
  )
}

export function makeTestDataUnsafe(cfg: Config) {
  // TODO: users from Auth0 / create local shadow.
  const patrick = new User({
    id: UserId.unsafe(cfg.AUTH_DISABLED ? "0" : "google-oauth2|118082603933712729435"),
    name: ReasonableString.unsafe("Patrick Roza"),
    email: Email.unsafe("somewhere@someplace.com"),
    phoneNumber: PhoneNumber.unsafe("+49 1234567"),
  })
  const mike = new User({
    id: UserId.unsafe("1"),
    name: ReasonableString.unsafe("Mike Arnaldi"),
    email: Email.unsafe("somewhere@someplace.com"),
    phoneNumber: PhoneNumber.unsafe("+49 1234567"),
  })
  const markus = new User({
    id: UserId.unsafe("2"),
    name: ReasonableString.unsafe("Markus Nomizz"),
    email: Email.unsafe("somewhere@someplace.com"),
    phoneNumber: PhoneNumber.unsafe("+49 1234567"),
  })

  const users = [patrick, mike, markus]

  const createPatrickList = User.createTaskList.r(patrick)
  const patrickList = createPatrickList({
    title: ReasonableString.unsafe("Some Patrick List"),
  })
  const patrickSharedList = createPatrickList({
    title: ReasonableString.unsafe("Patrick's shared List"),
    members: [Membership.fromUser(mike), Membership.fromUser(markus)],
  })

  const mikeSharedList = User.createTaskList._(mike, {
    title: ReasonableString.unsafe("Mike's shared List"),
    members: [Membership.fromUser(patrick)],
  })

  const markusSharedList = User.createTaskList._(markus, {
    title: ReasonableString.unsafe("Markus's shared List"),
    members: [Membership.fromUser(patrick)],
  })

  const lists = [
    patrickList,
    User.createTaskListGroup._(patrick, {
      title: ReasonableString.unsafe("Patrick - Some group"),
      lists: [patrickSharedList.id, patrickList.id],
    }),
    patrickSharedList,
    ///////
    User.createTaskListGroup._(mike, {
      title: ReasonableString.unsafe("Mike - Some group"),
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
      title: ReasonableString.unsafe("My first Task"),
      steps: [new Step({ title: ReasonableString.unsafe("first step") })],
    }),
    createPatrickTask({
      title: ReasonableString.unsafe("My second Task"),
    }),
    createPatrickTask({
      title: ReasonableString.unsafe("My third Task"),
      steps: [
        new Step({
          title: ReasonableString.unsafe("first step"),
          completed: true,
        }),
        new Step({ title: ReasonableString.unsafe("second step") }),
      ],
    })["|>"](Task.complete),
    createPatrickTask({
      title: ReasonableString.unsafe("My third Task"),
      steps: [
        new Step({
          title: ReasonableString.unsafe("first step"),
          completed: true,
        }),
        new Step({
          title: ReasonableString.unsafe("second step"),
        }),
      ],
      due: O.some(new Date(2021, 1, 1)),
    }),
    createPatrickTask({
      title: ReasonableString.unsafe("My third Task"),
      steps: [
        new Step({
          title: ReasonableString.unsafe("first step"),
          completed: true,
        }),
        new Step({
          title: ReasonableString.unsafe("second step"),
        }),
      ],
      due: O.some(new Date(2021, 2, 1)),
    }),

    createPatrickTask({
      title: ReasonableString.unsafe("My fourth Task"),
      steps: [
        new Step({
          title: ReasonableString.unsafe("first step"),
          completed: true,
        }),
        new Step({
          title: ReasonableString.unsafe("second step"),
        }),
      ],
    }),

    createPatrickTask({
      title: ReasonableString.unsafe("My fifth Task"),
      steps: [
        new Step({
          title: ReasonableString.unsafe("first step"),
          completed: true,
        }),
        new Step({
          title: ReasonableString.unsafe("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      due: O.some(new Date(2021, 2, 1)),
    }),
    createPatrickTask({
      title: ReasonableString.unsafe("My sixth Task"),
      steps: [
        new Step({
          title: ReasonableString.unsafe("first step"),
          completed: true,
        }),
        new Step({
          title: ReasonableString.unsafe("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      isFavorite: true,
    }),

    createPatrickTask({
      title: ReasonableString.unsafe("My seventh Task"),
      steps: [
        new Step({
          title: ReasonableString.unsafe("first step"),
          completed: true,
        }),
        new Step({
          title: ReasonableString.unsafe("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      isFavorite: true,
    }),

    createPatrickTask({
      title: ReasonableString.unsafe("My eight Task"),
      steps: [
        new Step({
          title: ReasonableString.unsafe("first step"),
          completed: true,
        }),
        new Step({
          title: ReasonableString.unsafe("second step"),
        }),
      ],
      listId: patrickSharedList.id,
    }),
    ///////
    createMikeTask({
      title: ReasonableString.unsafe("My first Task"),
      steps: [new Step({ title: ReasonableString.unsafe("first step") })],
    }),
    createMikeTask({
      title: ReasonableString.unsafe("My second Task"),
      steps: [new Step({ title: ReasonableString.unsafe("first step") })],
      listId: mikeSharedList.id,
    }),
    ///////
    createMarkusTask({
      title: ReasonableString.unsafe("My first Task"),
      steps: [new Step({ title: ReasonableString.unsafe("first step") })],
    }),
    createMarkusTask({
      title: ReasonableString.unsafe("My second Task"),
      steps: [new Step({ title: ReasonableString.unsafe("first step") })],
      listId: markusSharedList.id,
    }),
  ]

  return { lists, users, tasks }
}
