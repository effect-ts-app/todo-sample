import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { Option } from "@effect-ts/core/Option"
import {
  array,
  date,
  defaultProp,
  Email,
  GetPartialConstructor,
  Model,
  namedC,
  ParsedShapeOf,
  partialConstructor,
  PhoneNumber,
  prop,
  props,
  reasonableString,
} from "@effect-ts-app/core/ext/Schema"

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
  inboxOrder: defaultProp(array(TaskId)),
  myDay: defaultProp(array(MyDay)),
  phoneNumber: prop(PhoneNumber),
}) {
  static createTask__ =
    (a: GetPartialConstructor<typeof User["createTask_"]>) => (u: User) =>
      User.createTask_(u, a)

  static createTask_ = (u: User, a: GetPartialConstructor<typeof User["createTask"]>) =>
    User.createTask(u)(a)
  static createTask = (u: User) => createPartialTask({ createdBy: u.id })

  static createTaskList__ =
    (a: GetPartialConstructor<typeof User["createTaskList_"]>) => (u: User) =>
      User.createTaskList_(u, a)

  static createTaskList_ = (
    u: User,
    a: GetPartialConstructor<typeof User["createTaskList"]>
  ) => User.createTaskList(u)(a)
  static createTaskList = (u: User) => createPartialTaskList({ ownerId: u.id })

  static createTaskListGroup__ =
    (a: GetPartialConstructor<typeof User["createTaskListGroup_"]>) => (u: User) =>
      User.createTaskListGroup_(u, a)
  static createTaskListGroup_ = (
    u: User,
    a: GetPartialConstructor<typeof User["createTaskListGroup"]>
  ) => User.createTaskListGroup(u)(a)
  static createTaskListGroup = (u: User) =>
    createPartialTaskListGroup({ ownerId: u.id })

  static getMyDay = (t: Task) => (u: User) =>
    A.findFirst_(u.myDay, (x) => x.id === t.id)["|>"](O.map((m) => m.date))
  static addToMyDay =
    (t: Task, date: Date) =>
    (u: User): User => ({
      ...u,
      myDay: A.findIndex_(u.myDay, (m) => m.id === t.id)
        ["|>"](O.chain((idx) => A.modifyAt_(u.myDay, idx, (m) => ({ ...m, date }))))
        ["|>"](O.getOrElse(() => A.snoc_(u.myDay, { id: t.id, date }))),
    })
  static removeFromMyDay =
    (t: Task) =>
    (u: User): User => ({
      ...u,
      myDay: u.myDay["|>"](A.filter((m) => m.id !== t.id)),
    })
  static toggleMyDay = (t: Task, myDay: Option<Date>) =>
    O.fold_(
      myDay,
      () => User.removeFromMyDay(t),
      (date) => User.addToMyDay(t, date)
    )
}
