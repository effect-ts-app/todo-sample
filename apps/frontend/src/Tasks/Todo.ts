import * as Todo from "@effect-ts-demo/todo-types"
import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import { flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Lens } from "@effect-ts/monocle"

const stepCompleted = Todo.Step.lens["|>"](Lens.prop("completed"))

export const toggleBoolean = Lens.modify<boolean>((x) => !x)
export const Step = Object.assign({}, Todo.Step, {
  create: (title: NonEmptyString) => Todo.Step.build({ title, completed: false }),
  toggleCompleted: stepCompleted["|>"](toggleBoolean),
})
export type Step = Todo.Step

const taskSteps = Todo.Task.lens["|>"](Lens.prop("steps"))
const createAndAddStep = flow(Step.create, A.snoc)
const toggleStepCompleted = (s: Step) => A.modifyOrOriginal(s, Step.toggleCompleted)
export const Task = Object.assign({}, Todo.Task, {
  addStep: (stepTitle: NonEmptyString) =>
    taskSteps["|>"](Lens.modify(createAndAddStep(stepTitle))),
  deleteStep: (s: Step) => taskSteps["|>"](Lens.modify(A.deleteOrOriginal(s))),
  toggleCompleted: Todo.Task.lens["|>"](Lens.prop("completed"))["|>"](
    Lens.modify((x) => (O.isSome(x) ? O.none : O.some(new Date())))
  ),
  toggleFavorite: Todo.Task.lens["|>"](Lens.prop("isFavorite"))["|>"](toggleBoolean),
  toggleStepCompleted: (s: Todo.Step) =>
    taskSteps["|>"](Lens.modify(toggleStepCompleted(s))),
})
export type Task = Todo.Task

export * from "@effect-ts-demo/todo-types/Task"
