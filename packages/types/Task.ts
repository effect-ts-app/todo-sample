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

const Task_ = make((F) =>
  F.interface({
    id: F.uuid(),
    createdAt: F.date(),

    title: NonEmptyString(F),
    completed: F.boolean(),
    steps: F.array(Step(F)),
  })
)

export interface Task extends AType<typeof Task_> {}
export interface TaskE extends EType<typeof Task_> {}
const TaskO = opaque<TaskE, Task>()(Task_)
export const Task = Object.assign(TaskO, {
  create: (a: Omit<Task, "id" | "createdAt" | "completed">) =>
    Task.build({ ...a, createdAt: new Date(), completed: false, id: makeUuid() }),
  complete: TaskO.lens["|>"](Lens.prop("completed")).set(true),
})
