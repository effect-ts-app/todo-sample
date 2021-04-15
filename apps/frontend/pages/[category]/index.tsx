import * as O from "@effect-ts/core/Option"
import React from "react"

import TasksScreen from "@/components/Tasks/TasksScreen"
import { TaskView, useRouteParams, Order, OrderDir } from "@/components/Tasks/data"

const Tasks = () => {
  const { category, order, orderDirection } = useRouteParams({
    category: TaskView,
    order: Order,
    orderDirection: OrderDir,
  })
  return (
    <TasksScreen
      category={category}
      order={order}
      orderDirection={orderDirection}
      taskId={O.none}
    />
  )
}

export default Tasks
