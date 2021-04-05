import * as Todo from "@effect-ts-demo/todo-types"
import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { Lens } from "@effect-ts/monocle"

const taskSteps = Todo.Task.lens["|>"](Lens.prop("steps"))
const stepCompleted = Todo.Step.lens["|>"](Lens.prop("completed"))

export const Step = Object.assign({}, Todo.Step, {
  toggleCompleted: stepCompleted["|>"](Lens.modify((x) => !x)),
})
export type Step = Todo.Step

export const Task = Object.assign({}, Todo.Task, {
  toggleCompleted: Todo.Task.lens["|>"](Lens.prop("completed"))["|>"](
    Lens.modify((x) => !x)
  ),
  toggleStepCompleted: (s: Todo.Step) =>
    taskSteps["|>"](Lens.modify(A.modifyOrOriginal(s, Step.toggleCompleted))),
})
export type Task = Todo.Task

export * from "@effect-ts-demo/todo-types/Task"
