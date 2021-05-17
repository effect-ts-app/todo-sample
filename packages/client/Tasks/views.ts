import { Model, namedC } from "@effect-ts-demo/core/ext/Schema"
import { EditablePersonalTaskProps, Task } from "@effect-ts-demo/todo-types"

@namedC("Task")
export class TaskView extends Model<TaskView>()({
  ...Task.Model.Api.props,
  ...EditablePersonalTaskProps,
}) {}
