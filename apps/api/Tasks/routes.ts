import { demandLoggedIn } from "@effect-ts-demo/infra/express/schema/requestHandler"
import * as R from "@effect-ts-demo/infra/express/schema/routing"
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
import UpdateTask from "./UpdateTask"
import UpdateTaskList from "./UpdateTaskList"
import UpdateTaskListGroup from "./UpdateTaskListGroup"
import UpdateTaskListOrder from "./UpdateTaskListOrder"

export const routes = T.tuple(
  R.match(GetMe, demandLoggedIn),
  R.match(GetTasks, demandLoggedIn),
  R.match(CreateTask, demandLoggedIn),
  R.match(FindTask, demandLoggedIn),
  R.match(UpdateTask, demandLoggedIn),
  R.match(DeleteTask, demandLoggedIn),

  R.match(UpdateTaskList, demandLoggedIn),
  R.match(UpdateTaskListOrder, demandLoggedIn),
  R.match(DeleteTaskList, demandLoggedIn),
  R.match(AddTaskListMember, demandLoggedIn),
  R.match(RemoveTaskListMember, demandLoggedIn),

  R.match(UpdateTaskListGroup, demandLoggedIn)
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
