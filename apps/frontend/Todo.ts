import { TaskListId } from "@effect-ts-demo/todo-types"
import { constant, flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { Lens } from "@effect-ts/monocle"
import { AType, make, makeADT } from "@effect-ts/morphic"

import { typedKeysOf } from "@/utils"

import * as A from "@effect-ts-demo/core/ext/Array"
import { makeKeys, NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import * as Todo from "@effect-ts-demo/todo-client/Tasks"

const stepCompleted = Todo.Step.lens["|>"](Lens.prop("completed"))

export * from "@effect-ts-demo/todo-types"

export const toggleBoolean = Lens.modify<boolean>((x) => !x)
export const Step = Object.assign({}, Todo.Step, {
  create: (title: NonEmptyString) => Todo.Step.build({ title, completed: false }),
  toggleCompleted: stepCompleted["|>"](toggleBoolean),
})
export type Step = Todo.Step

const taskSteps = Todo.Task.lens["|>"](Lens.prop("steps"))
const createAndAddStep = flow(Step.create, A.snoc)
const toggleStepCompleted = (s: Step) => A.modifyOrOriginal(s, Step.toggleCompleted)
const updateStepTitle = (s: Step) => (stepTitle: NonEmptyString) =>
  A.modifyOrOriginal(s, (s) => ({ ...s, title: stepTitle }))

const pastDate = (d: Date): O.Option<Date> => (d < new Date() ? O.some(d) : O.none)

export function updateTaskIndex(t: Task, newIndex: number) {
  return (tasks: A.Array<Task>) => {
    const modifiedTasks = tasks["|>"](A.filter((x) => x !== t))["|>"](
      A.insertAt(newIndex, t)
    )
    return modifiedTasks["|>"](O.getOrElse(() => tasks))
  }
}

export function updateStepIndex(s: Step, newIndex: number) {
  return (steps: A.Array<Step>) => {
    const modifiedSteps = steps["|>"](A.filter((x) => x !== s))["|>"](
      A.insertAt(newIndex, s)
    )
    return modifiedSteps["|>"](O.getOrElse(() => steps))
  }
}

export const Task = Object.assign({}, Todo.Task, {
  addStep: (stepTitle: NonEmptyString) =>
    taskSteps["|>"](Lens.modify(createAndAddStep(stepTitle))),
  deleteStep: (s: Step) => taskSteps["|>"](Lens.modify(A.deleteOrOriginal(s))),
  toggleCompleted: Todo.Task.lens["|>"](Lens.prop("completed"))["|>"](
    Lens.modify((x) => (O.isSome(x) ? O.none : O.some(new Date())))
  ),
  toggleMyDay: Todo.Task.lens["|>"](Lens.prop("myDay"))["|>"](
    Lens.modify((x) => (O.isSome(x) ? O.none : O.some(new Date())))
  ),
  toggleFavorite: Todo.Task.lens["|>"](Lens.prop("isFavorite"))["|>"](toggleBoolean),
  toggleStepCompleted: (s: Todo.Step) =>
    taskSteps["|>"](Lens.modify(toggleStepCompleted(s))),

  updateStep: (s: Todo.Step, stepTitle: NonEmptyString) =>
    taskSteps["|>"](Lens.modify(updateStepTitle(s)(stepTitle))),

  updateStepIndex: (s: Todo.Step, newIndex: number) =>
    taskSteps["|>"](Lens.modify(updateStepIndex(s, newIndex))),

  dueInPast: flow(Todo.Task.lens["|>"](Lens.prop("due")).get, O.chain(pastDate)),
  reminderInPast: flow(
    Todo.Task.lens["|>"](Lens.prop("reminder")).get,
    O.chain(pastDate)
  ),
})

export type Task = Todo.Task

export const TaskList = make((F) =>
  F.intersection(
    Todo.TaskList(F),
    F.interface({
      title: NonEmptyString(F),
      count: F.number(),
      _tag: F.stringLiteral("TaskList"),
    })
  )()
)
export type TaskList = AType<typeof TaskList>

export const TaskListGroup = make((F) =>
  F.interface({
    id: TaskListId(F),
    title: NonEmptyString(F),
    lists: F.array(TaskList(F)),
    _tag: F.stringLiteral("TaskListGroup"),
  })
)
export type TaskListGroup = AType<typeof TaskListGroup>

export const TaskListView = make((F) =>
  F.interface({
    title: NonEmptyString(F),
    count: F.number(),
    slug: F.string(),
    _tag: F.stringLiteral("TaskListView"),
  })
)
export type TaskListView = AType<typeof TaskListView>

export const FolderListADT = makeADT("_tag")({ TaskList, TaskListGroup, TaskListView })
export type FolderListADT = AType<typeof FolderListADT>

export const TaskViews = ["important", "my-day"] as const
export const TaskView = make((F) => F.keysOf(makeKeys(TaskViews)))
export type TaskView = AType<typeof TaskView>

const defaultDate = constant(new Date(1900, 1, 1))

export const orders = {
  creation: ORD.contramap_(ORD.date, (t: Todo.Task) => t.createdAt),
  important: ORD.contramap_(ORD.inverted(ORD.boolean), (t: Todo.Task) => t.isFavorite),
  alphabetically: ORD.contramap_(ORD.string, (t: Todo.Task) => t.title.toLowerCase()),
  due: ORD.contramap_(ORD.inverted(ORD.date), (t: Todo.Task) =>
    O.getOrElse_(t.due, defaultDate)
  ),
  // TODO. such order is based on "TaskView"
  myDay: ORD.contramap_(ORD.inverted(ORD.date), (t: Todo.Task) =>
    O.getOrElse_(t.myDay, defaultDate)
  ),
}

export type Orders = keyof typeof orders

const order = typedKeysOf(orders)
export const Order = make((F) => F.keysOf(makeKeys(order)))
export type Order = AType<typeof Order>

const orderDir = ["up", "down"] as const
export const OrderDir = make((F) => F.keysOf(makeKeys(orderDir)))
export type OrderDir = AType<typeof OrderDir>

export const Ordery = make((F) =>
  F.interface({
    kind: Order(F),
    dir: OrderDir(F),
  })
)
export type Ordery = AType<typeof Ordery>

export function filterByCategory(category: TaskView | string) {
  switch (category) {
    case "important":
      return A.filter((t: Todo.Task) => t.isFavorite)
    case "my-day": {
      const isToday = isSameDay(new Date())
      return A.filter((t: Todo.Task) =>
        t.myDay["|>"](O.map(isToday))["|>"](O.getOrElse(() => false))
      )
    }
    case "tasks": {
      return A.filter((t: Todo.Task) => t.listId === "inbox")
    }
    default:
      return A.filter((t: Todo.Task) => t.listId === category)
  }
}

function isSameDay(today: Date) {
  return (someDate: Date) => {
    return (
      someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
    )
  }
}

export const emptyTasks = [] as readonly Todo.Task[]

export * from "@effect-ts-demo/todo-types/Task"
