import {
  array,
  bool,
  constArray,
  ConstructorInputOf,
  date,
  literal,
  makeUuid,
  Model,
  namedC,
  nonEmptyString,
  nullable,
  ParsedShapeOf,
  union,
  UUID,
  withDefaultConstructorFields,
  prop,
  props,
} from "@effect-ts-demo/core/ext/Schema"
import { pipe } from "@effect-ts/core"
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
  pipe(props({ title: prop(nonEmptyString), completed: prop(bool) }), (s) =>
    withDefaultConstructorFields(s)({ completed: constant(false) })
  )
) {
  static complete = Lens.id<Step>()["|>"](Lens.prop("completed")).set(true)
}

export const EditableTaskProps = {
  title: prop(nonEmptyString),
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
  pipe(
    props({
      id: prop(TaskId),
      createdAt: prop(date),
      updatedAt: prop(date),
      createdBy: prop(UserId),
      listId: prop(TaskListIdU),
      ...EditableTaskProps,
    }),
    (s) =>
      withDefaultConstructorFields(s)({
        id: makeUuid,
        isFavorite: constant(false),
        steps: constArray,
        listId: constant("inbox"),
        createdAt: () => new Date(),
        updatedAt: () => new Date(),
        completed: constant(O.none),
        due: constant(O.none),
        reminder: constant(O.none),
        note: constant(O.none),
        assignedTo: constant(O.none),
      })
  )
) {
  static complete = Lens.id<Task>()
    ["|>"](Lens.prop("completed"))
    .set(O.some(new Date()))
}

@namedC
export class Membership extends Model<Membership>()(
  pipe(props({ id: prop(UserId), name: prop(nonEmptyString) }))
) {}

export const EditableTaskListProps = {
  title: prop(nonEmptyString),
}

@namedC
export class TaskList extends Model<TaskList>()(
  pipe(
    props({
      id: prop(TaskListId),
      ...EditableTaskListProps,
      order: prop(array(TaskId)),

      members: prop(array(Membership.Model)),
      ownerId: prop(UserId),
      _tag: prop(literal("TaskList")),
    }),
    (s) =>
      withDefaultConstructorFields(s)({
        id: makeUuid,
        order: constArray,
        members: constArray,
      })
  )
) {}

export const EditableTaskListGroupProps = {
  title: prop(nonEmptyString),
  lists: prop(array(TaskListId)),
}

@namedC
export class TaskListGroup extends Model<TaskListGroup>()(
  pipe(
    props({
      id: prop(TaskListId),
      ...EditableTaskListGroupProps,

      ownerId: prop(UserId),
      _tag: prop(literal("TaskListGroup")),
    }),
    (s) => withDefaultConstructorFields(s)({ id: makeUuid, lists: constArray })
  )
) {}

export const TaskListOrGroup = union({
  TaskList: TaskList.Model,
  TaskListGroup: TaskListGroup.Model,
})
export type TaskListOrGroup = ParsedShapeOf<typeof TaskListOrGroup>

const MyDay = props({ id: prop(TaskId), date: prop(date) })
type MyDay = ParsedShapeOf<typeof MyDay>

@namedC
export class User extends Model<User>()(
  pipe(
    props({
      id: prop(UserId),
      name: prop(nonEmptyString),
      inboxOrder: prop(array(TaskId)),
      myDay: prop(array(MyDay)) /* position */,
    }),
    (s) =>
      withDefaultConstructorFields(s)({
        inboxOrder: constArray,
        myDay: constArray,
      })
  )
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
