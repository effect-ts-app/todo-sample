import * as S from "@effect-ts-demo/core/ext/Schema"
import { EditablePersonalTaskProps, Task } from "@effect-ts-demo/todo-types"

export class TaskView extends S.Model<TaskView>()(
  S.intersect(Task.Model)(EditablePersonalTaskProps)
) {}
