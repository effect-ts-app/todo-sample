import * as A from "@effect-ts-app/core/Array"
import {
  array,
  constructor,
  identity,
  Model,
  literal,
  NonEmptyString,
  nonEmptyString,
  number,
  ParsedShapeOf,
  parser,
  prop,
  string,
  These,
  union,
  ReasonableString,
  parseStringE,
  leafE,
  ReasonableString,
  lensFromProps,
} from "@effect-ts-app/core/Schema"
import * as Todo from "@effect-ts-demo/todo-client/types"
import { TaskId, TaskListId } from "@effect-ts-demo/todo-client/types"
import { constant, flow, pipe, identity as ident } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { Lens } from "@effect-ts/monocle"

import { typedKeysOf } from "./utils"

export const toggleBoolean = Lens.modify<boolean>((x) => !x)

export class Step extends Todo.Step {
  static create = (title: Todo.Step["title"]) =>
    new Todo.Step({ title, completed: false })

  static lenses = lensFromProps<Step>()(Step.Model.Api.props)
  static toggleCompleted = Step.lenses.completed["|>"](toggleBoolean)
}

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
    Todo.Task.lenses.steps["|>"](Lens.modify(createAndAddStep(stepTitle)))
  static removeStep = (s: Step) =>
    Todo.Task.lenses.steps["|>"](Lens.modify(A.deleteOrOriginal(s)))
  static toggleCompleted = Todo.Task.lenses.completed["|>"](
    Lens.modify((x) => (O.isSome(x) ? O.none : O.some(new Date())))
  )
  static toggleMyDay = Todo.Task.lenses.myDay["|>"](
    Lens.modify((x) => (O.isSome(x) ? O.none : O.some(new Date())))
  )
  static toggleFavorite = Todo.Task.lenses.isFavorite["|>"](toggleBoolean)
  static toggleStepCompleted = (s: Todo.Step) =>
    Todo.Task.lenses.steps["|>"](Lens.modify(toggleStepCompleted(s)))

  static updateStep = (s: Todo.Step, stepTitle: Todo.Step["title"]) =>
    Todo.Task.lenses.steps["|>"](Lens.modify(updateStepTitle(s)(stepTitle)))

  static updateStepIndex = (s: Todo.Step, newIndex: number) =>
    Todo.Task.lenses.steps["|>"](Lens.modify(updateStepIndex(s, newIndex)))

  static dueInPast = flow(Todo.Task.lenses.due.get, O.chain(pastDate))
  static reminderInPast = flow(Todo.Task.lenses.reminder.get, O.chain(pastDate))
}

export class TaskList extends Model<TaskList>()({
  id: prop(TaskListId),
  title: prop(ReasonableString),
  order: prop(array(TaskId)),
  count: prop(number),
  _tag: prop(literal("TaskList")),
}) {}

export class TaskListGroup extends Model<TaskListGroup>()({
  id: prop(TaskListId),
  title: prop(ReasonableString),
  lists: prop(array(TaskList.Model)),
  _tag: prop(literal("TaskListGroup")),
}) {}

export class TaskListView extends Model<TaskListView>()({
  title: prop(ReasonableString),
  count: prop(number),
  slug: prop(string),
  _tag: prop(literal("TaskListView")),
}) {}

export const FolderListADT = union({
  TaskList,
  TaskListGroup,
  TaskListView,
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
  // Todo. such order is based on "TaskView"
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
    parser((x) =>
      isOrder(x) ? These.succeed(x) : These.fail(leafE(parseStringE("not order")))
    ),
    constructor((x) =>
      isOrder(x) ? These.succeed(x) : These.fail(leafE(parseStringE("not order")))
    )
  )
) // TODO

const orderDir = ["up", "down"] as const
export type OrderDir = typeof orderDir[number]
const isOrderDir = (u: any): u is OrderDir & NonEmptyString => u in orders
export const OrderDir = nonEmptyString[">>>"](
  pipe(
    identity(isOrderDir),
    parser((x) =>
      isOrderDir(x) ? These.succeed(x) : These.fail(leafE(parseStringE("not order")))
    ),
    constructor((x) =>
      isOrderDir(x) ? These.succeed(x) : These.fail(leafE(parseStringE("not order")))
    )
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
      return ident
    }
    default:
      return A.filter((t: Todo.Task) => t.listId === (category as any))
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

export const Category = ReasonableString
export type Category = ReasonableString

export * from "@effect-ts-demo/todo-client/types"
