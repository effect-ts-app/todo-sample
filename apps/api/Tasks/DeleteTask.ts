import * as TaskContext from "./TaskContext"
import { handle } from "./shared"

import * as DeleteTask from "@effect-ts-demo/todo-client/Tasks/DeleteTask"

export default handle(DeleteTask)((_) => TaskContext.delete(_.id))
