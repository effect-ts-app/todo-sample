import * as Todo from "@effect-ts-demo/todo-types"
import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import { Lens } from "@effect-ts/monocle"

const stepCompleted = Todo.Step.lens["|>"](Lens.prop("completed"))

export const Step = Object.assign({}, Todo.Step, {
  create: (title: NonEmptyString) => Todo.Step.build({ title, completed: false }),
  toggleCompleted: stepCompleted["|>"](Lens.modify((x) => !x)),
})
export type Step = Todo.Step

const taskSteps = Todo.Task.lens["|>"](Lens.prop("steps"))
export const Task = Object.assign({}, Todo.Task, {
  addStep: (stepTitle: NonEmptyString) =>
    taskSteps["|>"](Lens.modify(A.snoc(Step.create(stepTitle)))),
  toggleCompleted: Todo.Task.lens["|>"](Lens.prop("completed"))["|>"](
    Lens.modify((x) => !x)
  ),
  toggleStepCompleted: (s: Todo.Step) =>
    taskSteps["|>"](Lens.modify(A.modifyOrOriginal(s, Step.toggleCompleted))),
})
export type Task = Todo.Task

export * from "@effect-ts-demo/todo-types/Task"
