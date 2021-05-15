import * as A from "@effect-ts-demo/core/ext/Array"
import {
  array,
  constructor,
  Model,
  literal,
  NonEmptyString,
  nonEmptyString,
  number,
  ParsedShapeOf,
  parser,
  prop,
  props,
  string,
  These,
  union,
  reasonableString,
} from "@effect-ts-demo/core/ext/Schema"
import * as Todo from "@effect-ts-demo/todo-client/Tasks"
import { TaskId, TaskListId } from "@effect-ts-demo/todo-client/Tasks"
import { constant, flow, identity, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { Lens } from "@effect-ts/monocle"

import { typedKeysOf } from "./utils"

const stepCompleted = Todo.Step.lens["|>"](Lens.prop("completed"))

export const toggleBoolean = Lens.modify<boolean>((x) => !x)
export class Step extends Todo.Step {
  static create = (title: Todo.Step["title"]) =>
    new Todo.Step({ title, completed: false })
  static toggleCompleted = stepCompleted["|>"](toggleBoolean)
}

const taskSteps = Todo.Task.lens["|>"](Lens.prop("steps"))
const createAndAddStep = flow(Step.create, A.snoc)
const toggleStepCompleted = (s: Step) => A.modifyOrOriginal(s, Step.toggleCompleted)
const updateStepTitle = (s: Step) => (stepTitle: Todo.Step["title"]) =>
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
  static addStep = (stepTitle: Todo.Step["title"]) =>
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

  static updateStep = (s: Todo.Step, stepTitle: Todo.Step["title"]) =>
    taskSteps["|>"](Lens.modify(updateStepTitle(s)(stepTitle)))

  static updateStepIndex = (s: Todo.Step, newIndex: number) =>
    taskSteps["|>"](Lens.modify(updateStepIndex(s, newIndex)))

  static dueInPast = flow(Todo.Task.lens["|>"](Lens.prop("due")).get, O.chain(pastDate))
  static reminderInPast = flow(
    Todo.Task.lens["|>"](Lens.prop("reminder")).get,
    O.chain(pastDate)
  )
}

export class TaskList extends Model<TaskList>()(
  props({
    id: prop(TaskListId),
    title: prop(reasonableString),
    order: prop(array(TaskId)),
    count: prop(number),
    _tag: prop(literal("TaskList")),
  })
) {}

export class TaskListGroup extends Model<TaskListGroup>()(
  props({
    id: prop(TaskListId),
    title: prop(reasonableString),
    lists: prop(array(TaskList.Model)),
    _tag: prop(literal("TaskListGroup")),
  })
) {}

export class TaskListView extends Model<TaskListView>()(
  props({
    title: prop(reasonableString),
    count: prop(number),
    slug: prop(string),
    _tag: prop(literal("TaskListView")),
  })
) {}

export const FolderListADT = union({
  TaskList: TaskList.Model,
  TaskListGroup: TaskListGroup.Model,
  TaskListView: TaskListView.Model,
})
export type FolderListADT = ParsedShapeOf<typeof FolderListADT>

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

const isOrder = (u: any): u is Order & NonEmptyString => u in orders
export const Order = nonEmptyString[">>>"](
  pipe(
    identity(isOrder),
    parser((x) => (isOrder(x) ? These.succeed(x) : These.fail("not order"))),
    constructor((x) => (isOrder(x) ? These.succeed(x) : These.fail("not order")))
  )
) // TODO

const orderDir = ["up", "down"] as const
export type OrderDir = typeof orderDir[number]
const isOrderDir = (u: any): u is OrderDir & NonEmptyString => u in orders
export const OrderDir = nonEmptyString[">>>"](
  pipe(
    identity(isOrderDir),
    parser((x) => (isOrderDir(x) ? These.succeed(x) : These.fail("not order"))),
    constructor((x) => (isOrderDir(x) ? These.succeed(x) : These.fail("not order")))
  )
) // TODO

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

export const Category = nonEmptyString
export type Category = NonEmptyString

export * from "@effect-ts-demo/todo-types"
export * from "@effect-ts-demo/todo-types/Task"
