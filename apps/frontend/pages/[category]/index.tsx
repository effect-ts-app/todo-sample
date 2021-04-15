import * as O from "@effect-ts/core/Option"
import { useRouter } from "next/router"
import React from "react"

import TasksScreen, { getQueryParam } from "@/components/Tasks/TasksScreen"
import { findCategory, Orders } from "@/components/Tasks/data"
const Tasks = () => {
  const r = useRouter()
  return (
    <TasksScreen
      category={findCategory(getQueryParam(r.query, "category")!)}
      order={O.fromNullable(getQueryParam(r.query, "order") as Orders)}
      orderDirection={O.fromNullable(
        getQueryParam(r.query, "orderDirection") as "up" | "down"
      )}
      taskId={O.none}
    />
  )
}

export default Tasks
