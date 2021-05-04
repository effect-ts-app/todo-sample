import {
  AType,
  EType,
  make,
  makeADT,
  opaque,
  PositiveInt,
  makeUuid,
  NonEmptyString,
  UUID,
} from "@effect-ts-demo/core/ext/Model"
import { extendM } from "@effect-ts-demo/core/ext/utils"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { Option } from "@effect-ts/core/Option"
import * as Lens from "@effect-ts/monocle/Lens"
import { CoreAlgebra } from "@effect-ts/morphic/Batteries/program"
import { BaseFC } from "@effect-ts/morphic/FastCheck/base"
import { guard } from "@effect-ts/morphic/Guard"

export const UserId = PositiveInt
export type UserId = AType<typeof UserId>

export const TaskId = UUID
export type TaskId = AType<typeof TaskId>

const TaskListIdLiteral = make((F) => F.stringLiteral("inbox"))

export const TaskListIdU = UUID
export type TaskListIdU = AType<typeof TaskListIdU>

export const TaskListId = make((F) =>
  F.union(
    TaskListIdU(F),
    TaskListIdLiteral(F)
  )({
    guards: [guard(TaskListIdU).is, guard(TaskListIdLiteral).is],
  })
)
export type TaskListId = AType<typeof TaskListId>

export const Step_ = make((F) =>
  F.interface(
    { title: NonEmptyString(F), completed: F.boolean() },
    { extensions: { openapiRef: "Step" } }
  )
)
export interface Step extends AType<typeof Step_> {}
export interface StepE extends EType<typeof Step_> {}
const StepO = opaque<StepE, Step>()(Step_)
export const Step = Object.assign(StepO, {
  create: (a: Omit<Step, "completed">) => Step.build({ ...a, completed: false }),
  complete: StepO.lens["|>"](Lens.prop("completed")).set(true),
})

export const Steps = make((F) => F.array(Step(F)))
export const Completed = make((F) => F.nullable(F.date()))

export function EditableTaskProps<Env extends BaseFC>(F: CoreAlgebra<"HKT", Env>) {
  return {
    title: NonEmptyString(F),
    completed: Completed(F),
    isFavorite: F.boolean(),

    due: F.nullable(F.date()),
    reminder: F.nullable(F.date()),
    note: F.nullable(NonEmptyString(F)),
    steps: Steps(F),
    assignedTo: F.nullable(UserId(F)),
  }
}

export function EditablePersonalTaskProps<Env extends BaseFC>(
  F: CoreAlgebra<"HKT", Env>
) {
  return {
    myDay: F.nullable(F.date()),
  }
}

// const EditableTaskPropsM = make((F) => F.interface(EditableTaskProps(F)))
// export type EditableTaskProps = AType<typeof EditableTaskPropsM>

const Task_ = make((F) =>
  F.interface(
    {
      id: TaskId(F),
      createdAt: F.date(),
      updatedAt: F.date(),
      createdBy: UserId(F),
      listId: TaskListId(F),

      ...EditableTaskProps(F),
    },
    { extensions: { openapiRef: "Task" } }
  )
)

export interface Task extends AType<typeof Task_> {}
export interface TaskE extends EType<typeof Task_> {}
const TaskO = opaque<TaskE, Task>()(Task_)
export const Task = Object.assign(TaskO, {
  create: (
    a: Pick<Task, "title" | "createdBy"> &
      Partial<Pick<Task, "isFavorite" | "listId" | "steps">>
  ) => {
    const createdAt = new Date()
    return Task.build({
      completed: O.none,
      due: O.none,
      note: O.none,
      reminder: O.none,
      assignedTo: O.none,

      ...a,

      isFavorite: a.isFavorite ?? false,
      listId: a.listId ?? "inbox",

      steps: a.steps ?? [],

      id: makeUuid(),
      createdAt,
      updatedAt: createdAt,

      //myDay: a.myDay ?? O.none,
    })
  },
  complete: TaskO.lens["|>"](Lens.prop("completed")).set(O.some(new Date())),
})

// MainTaskList - the personal Tasks list each user has
// SharableTaskList - any list of Tasks that can be shared
// - owner
// - members

// MyLists = all lists where I am owner + shared lists where I am member. Owner cannot be member.
// Each individual user should be able to put a SharableTaskList under a TaskGroup as he pleases.
// ordering within the list
// moving items between lists.

// FE; tasklists contain tasks. BE: tasks have task.listID
// Important change for scalability.
const TaskList_ = make((F) =>
  F.interface({
    id: TaskListId(F),
    title: NonEmptyString(F),
    order: F.array(TaskId(F)),
  })
)

export interface TaskList extends AType<typeof TaskList_> {}
export interface TaskListE extends EType<typeof TaskList_> {}
export const TaskList = opaque<TaskListE, TaskList>()(TaskList_)

const Member = make((F) =>
  F.interface({
    id: UserId(F),
    // Just to keep things simple for now, normally we should be able to resolve these later.
    name: NonEmptyString(F),
  })
)

// export const VirtualTask = make((F) =>
//   F.interface({
//     id: TaskId(F),
//     // TODO: Or should shared tasks be in a format that has these infos
//     // embedded inside the task via members: MemberSpecificInfo[]
//     // no; within a List, the Tasks inside must always be bound to owner by default?
//     // yes; it is more flexible to keep member info? but have to clean up.
//     isFavorite: F.boolean(),
//     myDay: F.nullable(F.date()),
//     reminder: F.nullable(F.date()),
//     _tag: F.stringLiteral("VirtualTask"),
//   })
// )
// export type VirtualTask = AType<typeof VirtualTask>

const SharableTaskList_ = make((F) =>
  F.interface({
    id: TaskListIdU(F),
    title: NonEmptyString(F),
    order: F.array(TaskId(F)),

    members: F.array(Member(F)),
    ownerId: UserId(F),
    // tasks: F.array(TaskOrVirtualTask(F))
    _tag: F.stringLiteral("TaskList"),
  })
)

export interface SharableTaskList extends AType<typeof SharableTaskList_> {}
export interface SharableTaskListE extends EType<typeof SharableTaskList_> {}
export const SharableTaskList = opaque<SharableTaskListE, SharableTaskList>()(
  SharableTaskList_
)

// const VirtualTaskList = make((F) =>
//   F.interface({
//     id: TaskListId(F),
//     _tag: F.stringLiteral("VirtualTaskList"),
//     // tasks: VirtualTask, for ordering.. otherwise, shared lists should have custom orders ;-)
//   })
// )

const TaskListOrVirtual_ = makeADT("_tag")({
  TaskList: SharableTaskList,
  //VirtualTaskList,
})
export type TaskListOrVirtual = AType<typeof TaskListOrVirtual_>

export const TaskLists = make((F) => F.array(TaskListOrVirtual(F)))
export type TaskLists = AType<typeof TaskLists>

// TaskListGroups contains tasklists
const TaskListGroup_ = make((F) =>
  F.interface({
    id: TaskListIdU(F),
    title: NonEmptyString(F),
    ownerId: UserId(F),
    lists: F.array(TaskListId(F)),
    _tag: F.stringLiteral("TaskListGroup"),
  })
)
export interface TaskListGroup extends AType<typeof TaskListGroup_> {}
export interface TaskListGroupE extends EType<typeof TaskListGroup_> {}
export const TaskListGroup = opaque<TaskListGroupE, TaskListGroup>()(TaskListGroup_)

const TaskListOrGroup_ = makeADT("_tag")({
  TaskListGroup,
  TaskList: SharableTaskList,
  //VirtualTaskList,
})

export const TaskListOrGroup = extendM(TaskListOrGroup_, ({ as, of }) => ({
  as: {
    ...as,
    TaskList: ({
      order,
      ...a
    }: Omit<SharableTaskList, "_tag" | "order"> &
      Partial<Pick<SharableTaskList, "order">>) =>
      as.TaskList({ ...a, order: order ?? [] }),
  },
  of: {
    ...of,
    TaskList: ({
      order,
      ...a
    }: Omit<SharableTaskList, "_tag" | "order"> &
      Partial<Pick<SharableTaskList, "order">>) =>
      of.TaskList({ ...a, order: order ?? [] }),
  },
}))

export const TaskListOrVirtual = extendM(TaskListOrVirtual_, ({ as, of }) => ({
  as: {
    ...as,
    TaskList: ({
      order,
      ...a
    }: Omit<SharableTaskList, "_tag" | "order"> &
      Partial<Pick<SharableTaskList, "order">>) =>
      as.TaskList({ ...a, order: order ?? [] }),
  },
  of: {
    ...of,
    TaskList: ({
      order,
      ...a
    }: Omit<SharableTaskList, "_tag" | "order"> &
      Partial<Pick<SharableTaskList, "order">>) =>
      of.TaskList({ ...a, order: order ?? [] }),
  },
}))

export type TaskListOrGroup = AType<typeof TaskListOrGroup_>

const User_ = make((F) =>
  F.interface({
    id: UserId(F),
    name: NonEmptyString(F),
    inboxOrder: F.array(TaskId(F)),
    myDay: F.array(F.interface({ id: TaskId(F), date: F.date() /* position */ })),

    // TODO: or do reminders depend on the assignee?
    //reminders: F.array(F.interface({ id: TaskId(F), date: F.date() })),
  })
)

export interface User extends AType<typeof User_> {}
export interface UserE extends EType<typeof User_> {}
const User__ = opaque<UserE, User>()(User_)
export const User = Object.assign(User__, {
  create: (
    _: Pick<User, "id" | "name"> & Partial<Pick<User, "myDay" | "inboxOrder">>
  ) =>
    User__.build({
      ..._,
      myDay: _.myDay ?? [],
      inboxOrder: _.inboxOrder ?? [],
    }),

  createTask: (a: Omit<Parameters<typeof Task.create>[0], "createdBy">) => (u: User) =>
    Task.create({ ...a, createdBy: u.id }),
  getMyDay: (t: Task) => (u: User) =>
    A.findFirst_(u.myDay, (x) => x.id === t.id)["|>"](O.map((m) => m.date)),
  addToMyDay: (t: Task, date: Date) => (u: User) => ({
    ...u,
    myDay: A.findIndex_(u.myDay, (m) => m.id === t.id)
      ["|>"](O.chain((idx) => A.modifyAt_(u.myDay, idx, (m) => ({ ...m, date }))))
      ["|>"](O.getOrElse(() => A.snoc_(u.myDay, { id: t.id, date }))),
  }),
  removeFromMyDay: (t: Task) => (u: User) => ({
    ...u,
    myDay: u.myDay["|>"](A.filter((m) => m.id !== t.id)),
  }),
  toggleMyDay: (t: Task, myDay: Option<Date>) =>
    O.fold_(
      myDay,
      () => User.removeFromMyDay(t),
      (date) => User.addToMyDay(t, date)
    ),
})
