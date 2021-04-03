import * as Lens from "@effect-ts/monocle/Lens"
import { AType, EType, make, opaque } from "@effect-ts/morphic"

import { NonEmptyString } from "./shared"

export const Step = NonEmptyString
export type Step = AType<typeof Step>

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
  complete: TaskO.lens["|>"](Lens.prop("completed")).set(true),
})
