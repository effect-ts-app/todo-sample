import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as EO from "@effect-ts-app/core/ext/EffectOption"
import * as O from "@effect-ts-app/core/ext/Option"
import { handle } from "@effect-ts-app/infra/app"
import { Tasks } from "@effect-ts-demo/todo-client"
import { Task, User } from "@effect-ts-demo/todo-types"

import { TodoContext } from "@/services"

import { TaskAuth } from "./_access"

export default handle(Tasks.Find)((_) =>
  EO.gen(function* ($) {
    const { Lists, Tasks } = yield* $(TodoContext.TodoContext)

    const task = yield* $(Tasks.find(_.id))
    const user = yield* $(TodoContext.getLoggedInUser)
    const taskLists = yield* $(Lists.allLists(user.id))

    return yield* $(TaskAuth(taskLists).access_(task, user.id, personaliseTask(user)))
  })
)

export function personaliseTask(u: User) {
  return (t: Task) => ({
    ...t,
    myDay: A.findFirst_(u.myDay, (x) => x.id === t.id)["|>"](O.map((m) => m.date)),
    reminder: A.findFirst_(u.reminder, (x) => x.id === t.id)["|>"](
      O.map((m) => m.date)
    ),
  })
}
