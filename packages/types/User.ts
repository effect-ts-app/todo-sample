import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { Option } from "@effect-ts/core/Option"
import {
  array,
  date,
  defaultProp,
  Email,
  Model,
  namedC,
  ParsedShapeOf,
  partialConstructor,
  PhoneNumber,
  prop,
  props,
  reasonableString,
} from "@effect-ts-app/core/ext/Schema"
import { reverseCurriedMagix } from "@effect-ts-app/core/ext/utils"

import { TaskId, UserId } from "./ids"
import { Task } from "./Task"
import { TaskList, TaskListGroup } from "./TaskList"

const MyDay = props({ id: prop(TaskId), date: prop(date) /* position */ })
type MyDay = ParsedShapeOf<typeof MyDay>

const createPartialTask = partialConstructor(Task)
const createPartialTaskList = partialConstructor(TaskList)
const createPartialTaskListGroup = partialConstructor(TaskListGroup)

@namedC()
export class User extends Model<User>()({
  id: prop(UserId),
  email: prop(Email),
  name: prop(reasonableString),
  phoneNumber: prop(PhoneNumber),

  inboxOrder: defaultProp(array(TaskId)),
  // Task customisation per user.
  // alternatives: customisations: array(TaskCustomisation)
  myDay: defaultProp(array(MyDay)),
  reminder: defaultProp(array(MyDay)),
}) {
  static createTask = reverseCurriedMagix((u: User) =>
    createPartialTask({ createdBy: u.id })
  )
  static createTaskList = reverseCurriedMagix((u: User) =>
    createPartialTaskList({ ownerId: u.id })
  )
  static createTaskListGroup = reverseCurriedMagix((u: User) =>
    createPartialTaskListGroup({ ownerId: u.id })
  )

  // TODO: This doesn't scale well.
  static getReminder = (t: Task) => (u: User) =>
    A.findFirst_(u.reminder, (x) => x.id === t.id)["|>"](O.map((m) => m.date))
  static addToReminder =
    (t: Pick<Task, "id">, date: Date) =>
    (u: User): User => ({
      ...u,
      reminder: A.findIndex_(u.reminder, (m) => m.id === t.id)
        ["|>"](O.chain((idx) => A.modifyAt_(u.reminder, idx, (m) => ({ ...m, date }))))
        ["|>"](O.getOrElse(() => A.snoc_(u.reminder, { id: t.id, date }))),
    })
  static removeFromReminder =
    (t: Pick<Task, "id">) =>
    (u: User): User => ({
      ...u,
      reminder: u.reminder["|>"](A.filter((m) => m.id !== t.id)),
    })
  static toggleReminder = (t: Pick<Task, "id">, reminder: Option<Date>) =>
    O.fold_(
      reminder,
      () => User.removeFromReminder(t),
      (date) => User.addToReminder(t, date)
    )

  static getMyDay = (t: Task) => (u: User) =>
    A.findFirst_(u.myDay, (x) => x.id === t.id)["|>"](O.map((m) => m.date))
  static addToMyDay =
    (t: Pick<Task, "id">, date: Date) =>
    (u: User): User => ({
      ...u,
      myDay: A.findIndex_(u.myDay, (m) => m.id === t.id)
        ["|>"](O.chain((idx) => A.modifyAt_(u.myDay, idx, (m) => ({ ...m, date }))))
        ["|>"](O.getOrElse(() => A.snoc_(u.myDay, { id: t.id, date }))),
    })
  static removeFromMyDay =
    (t: Pick<Task, "id">) =>
    (u: User): User => ({
      ...u,
      myDay: u.myDay["|>"](A.filter((m) => m.id !== t.id)),
    })
  static toggleMyDay = (t: Pick<Task, "id">, myDay: Option<Date>) =>
    O.fold_(
      myDay,
      () => User.removeFromMyDay(t),
      (date) => User.addToMyDay(t, date)
    )
}
