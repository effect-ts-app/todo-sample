import {
  AType,
  EType,
  make,
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

// FE; tasklists contain tasks. BE: tasks have task.listID
// Important change for scalability.
const TaskList_ = make((F) =>
  F.interface({
    title: NonEmptyString(F),
    tasks: F.array(Task(F)),
  })
)

export interface TaskList extends AType<typeof TaskList_> {}
export interface TaskListE extends EType<typeof TaskList_> {}
export const TaskList = opaque<TaskListE, TaskList>()(TaskList_)

// TaskListGroups contains tasklists
const TaskListGroup_ = make((F) =>
  F.interface({ title: NonEmptyString(F), lists: F.array(TaskList(F)) })
)
export interface TaskListGroup extends AType<typeof TaskListGroup_> {}
export interface TaskListGroupE extends EType<typeof TaskListGroup_> {}
export const TaskListGroup = opaque<TaskListGroupE, TaskListGroup>()(TaskListGroup_)

// In backend, tasks would be saved separately from lists and list separately from groups.
// so you would have a relationship db; task.listId,  list.groupId etc.
