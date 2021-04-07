import * as O from "@effect-ts/core/Option"
import * as Lens from "@effect-ts/monocle/Lens"
import { AType, EType, make, opaque } from "@effect-ts/morphic"

import { makeUuid, NonEmptyString } from "./shared"

export const Step_ = make((F) =>
  F.interface({ title: NonEmptyString(F), completed: F.boolean() })
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

const Task_ = make((F) =>
  F.interface({
    id: F.uuid(),
    createdAt: F.date(),
    updatedAt: F.date(),

    title: NonEmptyString(F),
    completed: Completed(F),
    steps: Steps(F),
  })
)

export interface Task extends AType<typeof Task_> {}
export interface TaskE extends EType<typeof Task_> {}
const TaskO = opaque<TaskE, Task>()(Task_)
export const Task = Object.assign(TaskO, {
  create: (a: Omit<Task, "id" | "createdAt" | "updatedAt" | "completed">) => {
    const createdAt = new Date()
    return Task.build({
      ...a,
      createdAt,
      updatedAt: createdAt,
      completed: O.none,
      id: makeUuid(),
    })
  },
  complete: TaskO.lens["|>"](Lens.prop("completed")).set(O.some(new Date())),
})
