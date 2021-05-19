import { handle } from "@effect-ts-app/infra/app"
import { TaskLists } from "@effect-ts-demo/todo-client"

import CreateTaskHandler from "../../Tasks/Create"

export default handle(TaskLists.CreateTask)(CreateTaskHandler.h)
