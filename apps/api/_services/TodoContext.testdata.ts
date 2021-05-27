// NOTE: Instead of an Object model, a Data model was defined..

import { flow } from "@effect-ts/core/Function"
import { Lens } from "@effect-ts/monocle"
import * as O from "@effect-ts-app/core/ext/Option"
import { Membership, Step, Task, User } from "@effect-ts-demo/todo-types"

import {
  emailUnsafe,
  phoneNumberUnsafe,
  reasonableStringUnsafe,
  userIdUnsafe,
} from "@/test.helpers"

import { Config } from "./Config"

function makeUserTaskCreator(u: User) {
  return flow(
    User.createTask.r(u),
    Task.lenses.title["|>"](
      Lens.modify((t) => reasonableStringUnsafe(`${u.name} - ${t}`))
    )
  )
}

export function makeTestDataUnsafe(cfg: Config) {
  // TODO: users from Auth0 / create local shadow.
  const patrick = new User({
    id: userIdUnsafe(cfg.AUTH_DISABLED ? "0" : "google-oauth2|118082603933712729435"),
    name: reasonableStringUnsafe("Patrick Roza"),
    email: emailUnsafe("somewhere@someplace.com"),
    phoneNumber: phoneNumberUnsafe("+49 1234567"),
  })
  const mike = new User({
    id: userIdUnsafe("1"),
    name: reasonableStringUnsafe("Mike Arnaldi"),
    email: emailUnsafe("somewhere@someplace.com"),
    phoneNumber: phoneNumberUnsafe("+49 1234567"),
  })
  const markus = new User({
    id: userIdUnsafe("2"),
    name: reasonableStringUnsafe("Markus Nomizz"),
    email: emailUnsafe("somewhere@someplace.com"),
    phoneNumber: phoneNumberUnsafe("+49 1234567"),
  })

  const users = [patrick, mike, markus]

  const createPatrickList = User.createTaskList.r(patrick)
  const patrickList = createPatrickList({
    title: reasonableStringUnsafe("Some Patrick List"),
  })
  const patrickSharedList = createPatrickList({
    title: reasonableStringUnsafe("Patrick's shared List"),
    members: [Membership.fromUser(mike), Membership.fromUser(markus)],
  })

  const mikeSharedList = User.createTaskList._(mike, {
    title: reasonableStringUnsafe("Mike's shared List"),
    members: [Membership.fromUser(patrick)],
  })

  const markusSharedList = User.createTaskList._(markus, {
    title: reasonableStringUnsafe("Markus's shared List"),
    members: [Membership.fromUser(patrick)],
  })

  const lists = [
    patrickList,
    User.createTaskListGroup._(patrick, {
      title: reasonableStringUnsafe("Patrick - Some group"),
      lists: [patrickSharedList.id, patrickList.id],
    }),
    patrickSharedList,
    ///////
    User.createTaskListGroup._(mike, {
      title: reasonableStringUnsafe("Mike - Some group"),
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
      title: reasonableStringUnsafe("My first Task"),
      steps: [new Step({ title: reasonableStringUnsafe("first step") })],
    }),
    createPatrickTask({
      title: reasonableStringUnsafe("My second Task"),
    }),
    createPatrickTask({
      title: reasonableStringUnsafe("My third Task"),
      steps: [
        new Step({
          title: reasonableStringUnsafe("first step"),
          completed: true,
        }),
        new Step({ title: reasonableStringUnsafe("second step") }),
      ],
    })["|>"](Task.complete),
    createPatrickTask({
      title: reasonableStringUnsafe("My third Task"),
      steps: [
        new Step({
          title: reasonableStringUnsafe("first step"),
          completed: true,
        }),
        new Step({
          title: reasonableStringUnsafe("second step"),
        }),
      ],
      due: O.some(new Date(2021, 1, 1)),
    }),
    createPatrickTask({
      title: reasonableStringUnsafe("My third Task"),
      steps: [
        new Step({
          title: reasonableStringUnsafe("first step"),
          completed: true,
        }),
        new Step({
          title: reasonableStringUnsafe("second step"),
        }),
      ],
      due: O.some(new Date(2021, 2, 1)),
    }),

    createPatrickTask({
      title: reasonableStringUnsafe("My fourth Task"),
      steps: [
        new Step({
          title: reasonableStringUnsafe("first step"),
          completed: true,
        }),
        new Step({
          title: reasonableStringUnsafe("second step"),
        }),
      ],
    }),

    createPatrickTask({
      title: reasonableStringUnsafe("My fifth Task"),
      steps: [
        new Step({
          title: reasonableStringUnsafe("first step"),
          completed: true,
        }),
        new Step({
          title: reasonableStringUnsafe("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      due: O.some(new Date(2021, 2, 1)),
    }),
    createPatrickTask({
      title: reasonableStringUnsafe("My sixth Task"),
      steps: [
        new Step({
          title: reasonableStringUnsafe("first step"),
          completed: true,
        }),
        new Step({
          title: reasonableStringUnsafe("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      isFavorite: true,
    }),

    createPatrickTask({
      title: reasonableStringUnsafe("My seventh Task"),
      steps: [
        new Step({
          title: reasonableStringUnsafe("first step"),
          completed: true,
        }),
        new Step({
          title: reasonableStringUnsafe("second step"),
        }),
      ],
      listId: patrickSharedList.id,
      isFavorite: true,
    }),

    createPatrickTask({
      title: reasonableStringUnsafe("My eight Task"),
      steps: [
        new Step({
          title: reasonableStringUnsafe("first step"),
          completed: true,
        }),
        new Step({
          title: reasonableStringUnsafe("second step"),
        }),
      ],
      listId: patrickSharedList.id,
    }),
    ///////
    createMikeTask({
      title: reasonableStringUnsafe("My first Task"),
      steps: [new Step({ title: reasonableStringUnsafe("first step") })],
    }),
    createMikeTask({
      title: reasonableStringUnsafe("My second Task"),
      steps: [new Step({ title: reasonableStringUnsafe("first step") })],
      listId: mikeSharedList.id,
    }),
    ///////
    createMarkusTask({
      title: reasonableStringUnsafe("My first Task"),
      steps: [new Step({ title: reasonableStringUnsafe("first step") })],
    }),
    createMarkusTask({
      title: reasonableStringUnsafe("My second Task"),
      steps: [new Step({ title: reasonableStringUnsafe("first step") })],
      listId: markusSharedList.id,
    }),
  ]

  return { lists, users, tasks }
}
