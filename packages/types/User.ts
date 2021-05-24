import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { Option } from "@effect-ts/core/Option"
import { LazyGetter } from "@effect-ts/core/Utils"
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
import { reverseCurry, uncurry } from "@effect-ts-app/core/ext/utils"

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
  @LazyGetter()
  static get createTask() {
    return reverseCurry(User.createTaskR)
  }

  @LazyGetter()
  static get createTask_() {
    return uncurry(User.createTask)
  }
  static createTaskR = (u: User) => createPartialTask({ createdBy: u.id })

  @LazyGetter()
  static get createTaskList() {
    return reverseCurry(User.createTaskListR)
  }

  @LazyGetter()
  static get createTaskList_() {
    return uncurry(User.createTaskList)
  }
  static createTaskListR = (u: User) => createPartialTaskList({ ownerId: u.id })

  @LazyGetter()
  static get createTaskListGroup() {
    return reverseCurry(User.createTaskListGroupR)
  }

  @LazyGetter()
  static get createTaskListGroup_() {
    return uncurry(User.createTaskListGroup)
  }
  static createTaskListGroupR = (u: User) =>
    createPartialTaskListGroup({ ownerId: u.id })

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
