import { EditablePersonalTaskProps, Task } from "@effect-ts-demo/todo-types"
import { make, AType } from "@effect-ts/morphic"

export const TaskView = make((F) =>
  F.intersection(Task(F), make((F) => F.interface(EditablePersonalTaskProps(F)))(F))()
)

export type TaskView = AType<typeof TaskView>
