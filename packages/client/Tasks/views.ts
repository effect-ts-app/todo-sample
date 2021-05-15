import * as S from "@effect-ts-demo/core/ext/Schema"
import { EditablePersonalTaskProps, Task } from "@effect-ts-demo/todo-types"

export class TaskView extends S.Model<TaskView>()(
  Task.Model["|>"](S.intersect(S.props(EditablePersonalTaskProps)))["|>"](
    S.named("Task")
  )
) {}
