import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"

import AddTaskListMember from "./AddTaskListMember"
import CreateTask from "./CreateTask"
import DeleteTask from "./DeleteTask"
import DeleteTaskList from "./DeleteTaskList"
import FindTask from "./FindTask"
import GetMe from "./GetMe"
import GetTasks from "./GetTasks"
import RemoveTaskListMember from "./RemoveTaskListMember"
import SetTasksOrder from "./SetTasksOrder"
import UpdateTask from "./UpdateTask"
import UpdateTaskList from "./UpdateTaskList"
import UpdateTaskListGroup from "./UpdateTaskListGroup"

import { demandLoggedIn } from "@effect-ts-demo/infra/express/schema/requestHandler"
import * as R from "@effect-ts-demo/infra/express/schema/routing"

export const routes = T.tuple(
  R.matchA(GetMe, demandLoggedIn),
  R.matchA(GetTasks, demandLoggedIn),
  R.matchA(CreateTask, demandLoggedIn),
  R.matchA(FindTask, demandLoggedIn),
  R.matchA(UpdateTask, demandLoggedIn),
  R.matchA(DeleteTask, demandLoggedIn),
  R.matchA(SetTasksOrder, demandLoggedIn),

  R.matchA(UpdateTaskList, demandLoggedIn),
  R.matchA(DeleteTaskList, demandLoggedIn),
  R.matchA(AddTaskListMember, demandLoggedIn),
  R.matchA(RemoveTaskListMember, demandLoggedIn),

  R.matchA(UpdateTaskListGroup, demandLoggedIn)
)["|>"](
  T.map((x) =>
    A.map_(x.tuple, (i) => ({
      ...i,
      info: {
        tags: [
          i.path.startsWith("/lists")
            ? "Lists"
            : i.path.startsWith("/groups")
            ? "Groups"
            : "Tasks",
        ],
      },
    }))
  )
)
