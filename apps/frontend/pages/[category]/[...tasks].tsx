import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import React from "react"

import TasksScreen from "@/components/Tasks/TasksScreen"
import { TaskView, Order, OrderDir, useRouteParams } from "@/components/Tasks/data"

const Tasks = () => {
  const { category, order, orderDirection, taskId } = useRouteParams({
    category: TaskView,
    order: Order,
    orderDirection: OrderDir,
    taskId: NonEmptyString,
  })
  return (
    <TasksScreen
      category={category}
      order={order}
      orderDirection={orderDirection}
      taskId={taskId}
    />
  )
}

export default Tasks
