import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import React from "react"

import TasksScreen from "@/features/Tasks/TasksScreen"
import { TaskView, Order, OrderDir } from "@/features/Tasks/data"
import { useRouteParams } from "@/routing"

function TasksPage() {
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

export default TasksPage
