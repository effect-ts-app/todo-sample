import { intersect, Model, named, props } from "@effect-ts-demo/core/ext/Schema"
import { EditablePersonalTaskProps, Task } from "@effect-ts-demo/todo-types"

export class TaskView extends Model<TaskView>()(
  Task.Model["|>"](intersect(props(EditablePersonalTaskProps)))["|>"](named("Task"))
) {}
