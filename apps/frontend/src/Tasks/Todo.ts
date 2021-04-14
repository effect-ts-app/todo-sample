import * as Todo from "@effect-ts-demo/todo-types"
import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import { flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Lens } from "@effect-ts/monocle"
import { AType, make, makeADT } from "@effect-ts/morphic"

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
    const modifiedSteps = tasks["|>"](A.filter((x) => x !== t))["|>"](
      A.insertAt(newIndex, t)
    )
    return modifiedSteps["|>"](O.getOrElse(() => tasks))
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
  F.intersection(Todo.TaskList(F), F.interface({ _tag: F.stringLiteral("TaskList") }))()
)

export const TaskListGroup = make((F) =>
  F.intersection(
    Todo.TaskListGroup(F),
    F.interface({ _tag: F.stringLiteral("TaskListGroup") })
  )()
)

export const FolderListADT = makeADT("_tag")({ TaskList, TaskListGroup })
export type FolderListADT = AType<typeof FolderListADT>

export * from "@effect-ts-demo/todo-types/Task"
