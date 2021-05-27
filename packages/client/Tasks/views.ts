import { Model, namedC } from "@effect-ts-app/core/ext/Schema"
import { UserTaskView } from "@effect-ts-demo/todo-types"

@namedC("Task")
export class TaskView extends Model<TaskView>()(UserTaskView.Model.Api.props) {}
