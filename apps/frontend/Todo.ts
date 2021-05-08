import { TaskId, TaskListId } from "@effect-ts-demo/todo-types"
import { constant, flow, identity } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { Lens } from "@effect-ts/monocle"

import { typedKeysOf } from "@/utils"

import * as A from "@effect-ts-demo/core/ext/Array"
import * as S from "@effect-ts-demo/core/ext/Schema"
import * as Todo from "@effect-ts-demo/todo-client/Tasks"

const stepCompleted = Todo.Step.lens["|>"](Lens.prop("completed"))

export * from "@effect-ts-demo/todo-types"

export const toggleBoolean = Lens.modify<boolean>((x) => !x)
export class Step extends Todo.Step {
  static create = (title: S.NonEmptyString) =>
    new Todo.Step({ title, completed: false })
  static toggleCompleted = stepCompleted["|>"](toggleBoolean)
}

const taskSteps = Todo.Task.lens["|>"](Lens.prop("steps"))
const createAndAddStep = flow(Step.create, A.snoc)
const toggleStepCompleted = (s: Step) => A.modifyOrOriginal(s, Step.toggleCompleted)
const updateStepTitle = (s: Step) => (stepTitle: S.NonEmptyString) =>
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

export class Task extends Todo.Task {
  static addStep = (stepTitle: S.NonEmptyString) =>
    taskSteps["|>"](Lens.modify(createAndAddStep(stepTitle)))
  static deleteStep = (s: Step) => taskSteps["|>"](Lens.modify(A.deleteOrOriginal(s)))
  static toggleCompleted = Todo.Task.lens["|>"](Lens.prop("completed"))["|>"](
    Lens.modify((x) => (O.isSome(x) ? O.none : O.some(new Date())))
  )
  static toggleMyDay = Todo.Task.lens["|>"](Lens.prop("myDay"))["|>"](
    Lens.modify((x) => (O.isSome(x) ? O.none : O.some(new Date())))
  )
  static toggleFavorite = Todo.Task.lens["|>"](Lens.prop("isFavorite"))["|>"](
    toggleBoolean
  )
  static toggleStepCompleted = (s: Todo.Step) =>
    taskSteps["|>"](Lens.modify(toggleStepCompleted(s)))

  static updateStep = (s: Todo.Step, stepTitle: S.NonEmptyString) =>
    taskSteps["|>"](Lens.modify(updateStepTitle(s)(stepTitle)))

  static updateStepIndex = (s: Todo.Step, newIndex: number) =>
    taskSteps["|>"](Lens.modify(updateStepIndex(s, newIndex)))

  static dueInPast = flow(Todo.Task.lens["|>"](Lens.prop("due")).get, O.chain(pastDate))
  static reminderInPast = flow(
    Todo.Task.lens["|>"](Lens.prop("reminder")).get,
    O.chain(pastDate)
  )
}

export class TaskList extends S.Model<TaskList>()(
  S.required({
    id: TaskListId,
    title: S.nonEmptyString,
    order: S.array(TaskId),
    count: S.number,
  })["|>"](S.tag("TaskList"))
) {}

export class TaskListGroup extends S.Model<TaskListGroup>()(
  S.required({
    id: TaskListId,
    title: S.nonEmptyString,
    lists: S.array(TaskList.Model),
  })["|>"](S.tag("TaskListGroup"))
) {}

export class TaskListView extends S.Model<TaskListView>()(
  S.required({
    title: S.nonEmptyString,
    count: S.number,
    slug: S.string,
  })["|>"](S.tag("TaskListView"))
) {}

export const FolderListADT = S.tagged(
  TaskList.Model,
  TaskListGroup.Model,
  TaskListView.Model
)
export type FolderListADT = S.ParsedShapeOf<typeof FolderListADT>

export const TaskViews = ["my-day", "important", "planned", "all"] as const
export type TaskView = typeof TaskViews[number]

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
export type Order = typeof order[number]
export const Order = S.nonEmptyString // TODO

const orderDir = ["up", "down"] as const
export type OrderDir = typeof orderDir[number]
export const OrderDir = S.nonEmptyString // TODO

export type Ordery = {
  kind: Order
  dir: OrderDir
}

export function filterByCategory(category: TaskView | string) {
  switch (category) {
    case "planned":
      return A.filter((t: Todo.Task) => O.isSome(t.due))
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
    case "all": {
      return identity
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
