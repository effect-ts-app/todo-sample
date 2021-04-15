import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import React from "react"

import TasksScreen from "@/components/Tasks/TasksScreen"
import { TaskView, Order, OrderDir } from "@/components/Tasks/data"
import { useRouteParams } from "@/data"

const Tasks = () => {
  const { category, order, orderDirection, tasks: taskId } = useRouteParams({
    category: TaskView,
    order: Order,
    orderDirection: OrderDir,
    tasks: NonEmptyString,
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
