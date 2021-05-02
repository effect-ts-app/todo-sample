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
import * as O from "@effect-ts/core/Option"
import * as Lens from "@effect-ts/monocle/Lens"
import { CoreAlgebra } from "@effect-ts/morphic/Batteries/program"
import { BaseFC } from "@effect-ts/morphic/FastCheck/base"

export const UserId = PositiveInt
export type UserId = AType<typeof UserId>

export const TaskId = UUID
export type TaskId = AType<typeof TaskId>

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
    myDay: F.nullable(F.date()),
    note: F.nullable(NonEmptyString(F)),
    steps: Steps(F),
    assignedTo: F.nullable(UserId(F)),
  }
}

const Task_ = make((F) =>
  F.interface(
    {
      id: TaskId(F),
      createdAt: F.date(),
      updatedAt: F.date(),

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
    a: Pick<Task, "title" | "steps"> & Partial<Pick<Task, "isFavorite" | "myDay">>
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

      id: makeUuid(),
      createdAt,
      updatedAt: createdAt,

      myDay: a.myDay ?? O.none,
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

export const TaskListId = UUID
export type TaskListId = AType<typeof TaskListId>

// FE; tasklists contain tasks. BE: tasks have task.listID
// Important change for scalability.
const TaskList_ = make((F) =>
  F.interface({
    id: TaskListId(F),
    tasks: F.array(Task(F)), // taskCount
    // order
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

export const VirtualTask = make((F) =>
  F.interface({
    id: TaskId(F),
    // TODO: Or should shared tasks be in a format that has these infos
    // embedded inside the task via members: MemberSpecificInfo[]
    // no; within a List, the Tasks inside must always be bound to owner by default?
    // yes; it is more flexible to keep member info? but have to clean up.
    isFavorite: F.boolean(),
    myDay: F.nullable(F.date()),
    reminder: F.nullable(F.date()),
    _tag: F.stringLiteral("VirtualTask"),
  })
)
export type VirtualTask = AType<typeof VirtualTask>

const SharableTaskList_ = make((F) =>
  F.intersection(
    TaskList(F),
    F.interface({
      title: NonEmptyString(F),
      members: F.array(Member(F)),
      // tasks: F.array(TaskOrVirtualTask(F))
      _tag: F.stringLiteral("TaskList"),
    })
  )()
)

export interface SharableTaskList extends AType<typeof SharableTaskList_> {}
export interface SharableTaskListE extends EType<typeof SharableTaskList_> {}
export const SharableTaskList = opaque<SharableTaskListE, SharableTaskList>()(
  SharableTaskList_
)

const VirtualTaskList = make((F) =>
  F.interface({
    id: TaskListId(F),
    _tag: F.stringLiteral("VirtualTaskList"),
    // tasks: VirtualTask, for ordering.. otherwise, shared lists should have custom orders ;-)
  })
)

export const TaskListOrVirtual = makeADT("_tag")({
  TaskList: SharableTaskList,
  VirtualTaskList,
})
export type TaskListOrVirtual = AType<typeof TaskListOrVirtual>

export const TaskLists = make((F) => F.array(TaskListOrVirtual(F)))
export type TaskLists = AType<typeof TaskLists>

// TaskListGroups contains tasklists
const TaskListGroup_ = make((F) =>
  F.interface({
    id: TaskListId(F),
    title: NonEmptyString(F),
    lists: TaskLists(F),
    _tag: F.stringLiteral("TaskListGroup"),
  })
)
export interface TaskListGroup extends AType<typeof TaskListGroup_> {}
export interface TaskListGroupE extends EType<typeof TaskListGroup_> {}
export const TaskListGroup = opaque<TaskListGroupE, TaskListGroup>()(TaskListGroup_)

export const TaskListOrGroup = makeADT("_tag")({
  TaskListGroup,
  TaskList: SharableTaskList,
  VirtualTaskList,
})

export type TaskListOrGroup = AType<typeof TaskListOrGroup>

// In backend, tasks would be saved separately from lists and list separately from groups.
// so you would have a relationship db; task.listId,  list.groupId etc.

// User
// - inbox: MainTaskList
// - groups: { lists: TaskList[] /* with ordering */ }[] // in DB: via ids?
// - lists: TaskList[] // ordering
// start payload; only load the list names
// then load each list, and show the count of the list.

const User_ = make((F) =>
  F.interface({
    id: UserId(F),
    name: NonEmptyString(F),
    inbox: TaskList(F),
    lists: F.array(TaskListOrGroup(F)), // query also for other user's shared lists im member of ;-)
  })
)

export interface User extends AType<typeof User_> {}
export interface UserE extends EType<typeof User_> {}
export const User = opaque<UserE, User>()(User_)
