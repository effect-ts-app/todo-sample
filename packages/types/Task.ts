import {
  array,
  bool,
  ConstructorInputOf,
  date,
  literal,
  Model,
  namedC,
  nonEmptyString,
  nullable,
  ParsedShapeOf,
  union,
  UUID,
  prop,
  props,
  include,
  withDefault,
  defaultProp,
  reasonableString,
  Email,
  PhoneNumber,
} from "@effect-ts-demo/core/ext/Schema"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { Option } from "@effect-ts/core/Option"
import * as Lens from "@effect-ts/monocle/Lens"
import { constant } from "@effect-ts/system/Function"

export const UserId = nonEmptyString
export type UserId = ParsedShapeOf<typeof UserId>

export const TaskId = UUID
export type TaskId = ParsedShapeOf<typeof TaskId>

export const InboxTaskList = literal("inbox")
export const TaskListId = UUID
export type TaskListId = ParsedShapeOf<typeof TaskListId>

export const TaskListIdU = union({ TaskListId, InboxTaskList })
export type TaskListIdU = ParsedShapeOf<typeof TaskListIdU>

@namedC
export class Step extends Model<Step>()(
  props({
    title: prop(reasonableString),
    completed: defaultProp(bool),
  })
) {
  static complete = Lens.id<Step>()["|>"](Lens.prop("completed")).set(true)
}

export const EditableTaskProps = {
  title: prop(reasonableString),
  completed: prop(nullable(date)),
  isFavorite: prop(bool),

  due: prop(nullable(date)),
  reminder: prop(nullable(date)),
  note: prop(nullable(nonEmptyString)),
  steps: prop(array(Step.Model)),
  assignedTo: prop(nullable(UserId)),
}

export const EditablePersonalTaskProps = {
  myDay: prop(nullable(date)),
}

export class Task extends Model<Task>()(
  props({
    id: defaultProp(TaskId),
    createdBy: prop(UserId),
    listId: defaultProp(TaskListIdU, constant("inbox" as const)),
    createdAt: defaultProp(date),
    updatedAt: defaultProp(date),
    ...include(EditableTaskProps)(
      ({ assignedTo, completed, due, isFavorite, note, reminder, steps, ...rest }) => ({
        ...rest,
        assignedTo: assignedTo["|>"](withDefault),
        completed: completed["|>"](withDefault),
        due: due["|>"](withDefault),
        note: note["|>"](withDefault),
        reminder: reminder["|>"](withDefault),
        isFavorite: isFavorite["|>"](withDefault),
        steps: steps["|>"](withDefault),
      })
    ),
  })
) {
  static complete = Lens.id<Task>()
    ["|>"](Lens.prop("completed"))
    .set(O.some(new Date()))
}

@namedC
export class Membership extends Model<Membership>()(
  props({ id: prop(UserId), name: prop(reasonableString) })
) {}

export const EditableTaskListProps = {
  title: prop(reasonableString),
}

@namedC
export class TaskList extends Model<TaskList>()(
  props({
    _tag: prop(literal("TaskList")),
    id: defaultProp(TaskListId),
    ...EditableTaskListProps,
    order: defaultProp(array(TaskId)),

    members: defaultProp(array(Membership.Model)),
    ownerId: prop(UserId),
  })
) {}

export const EditableTaskListGroupProps = {
  title: prop(reasonableString),
  lists: prop(array(TaskListId)),
}

@namedC
export class TaskListGroup extends Model<TaskListGroup>()(
  props({
    _tag: prop(literal("TaskListGroup")),
    id: defaultProp(TaskListId),
    ...include(EditableTaskListGroupProps)(({ lists, ...rest }) => ({
      ...rest,
      lists: lists["|>"](withDefault),
    })),

    ownerId: prop(UserId),
  })
) {}

export const TaskListOrGroup = union({
  TaskList: TaskList.Model,
  TaskListGroup: TaskListGroup.Model,
})
export type TaskListOrGroup = ParsedShapeOf<typeof TaskListOrGroup>

const MyDay = props({ id: prop(TaskId), date: prop(date) /* position */ })
type MyDay = ParsedShapeOf<typeof MyDay>

@namedC
export class User extends Model<User>()(
  props({
    id: prop(UserId),
    email: prop(Email),
    name: prop(reasonableString),
    inboxOrder: defaultProp(array(TaskId)),
    myDay: defaultProp(array(MyDay)),
    phoneNumber: prop(PhoneNumber),
  })
) {
  // TODO: could these just be type specialisations with new defaults?
  static readonly createTask =
    (a: Omit<ConstructorInputOf<typeof Task["Model"]>, "createdBy">) => (u: User) =>
      new Task({ ...a, createdBy: u.id })
  static readonly createTask_ =
    (u: User) => (a: Omit<ConstructorInputOf<typeof Task["Model"]>, "createdBy">) =>
      new Task({ ...a, createdBy: u.id })

  static readonly createTaskList =
    (a: Omit<ConstructorInputOf<typeof TaskList["Model"]>, "ownerId">) => (u: User) =>
      new TaskList({ ...a, ownerId: u.id })
  static readonly createTaskList_ =
    (u: User) => (a: Omit<ConstructorInputOf<typeof TaskList["Model"]>, "ownerId">) =>
      new TaskList({ ...a, ownerId: u.id })

  static readonly createTaskListGroup =
    (a: Omit<ConstructorInputOf<typeof TaskListGroup["Model"]>, "ownerId">) =>
    (u: User) =>
      new TaskListGroup({ ...a, ownerId: u.id })
  static readonly createTaskListGroup_ =
    (u: User) =>
    (a: Omit<ConstructorInputOf<typeof TaskListGroup["Model"]>, "ownerId">) =>
      new TaskListGroup({ ...a, ownerId: u.id })

  static readonly getMyDay = (t: Task) => (u: User) =>
    A.findFirst_(u.myDay, (x) => x.id === t.id)["|>"](O.map((m) => m.date))
  static readonly addToMyDay =
    (t: Task, date: Date) =>
    (u: User): User => ({
      ...u,
      myDay: A.findIndex_(u.myDay, (m) => m.id === t.id)
        ["|>"](O.chain((idx) => A.modifyAt_(u.myDay, idx, (m) => ({ ...m, date }))))
        ["|>"](O.getOrElse(() => A.snoc_(u.myDay, { id: t.id, date }))),
    })
  static readonly removeFromMyDay =
    (t: Task) =>
    (u: User): User => ({
      ...u,
      myDay: u.myDay["|>"](A.filter((m) => m.id !== t.id)),
    })
  static readonly toggleMyDay = (t: Task, myDay: Option<Date>) =>
    O.fold_(
      myDay,
      () => User.removeFromMyDay(t),
      (date) => User.addToMyDay(t, date)
    )
}
