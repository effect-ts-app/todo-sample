import * as O from "@effect-ts/core/Option"
import React from "react"

import TasksScreen from "@/features/Tasks/TasksScreen"
import { TaskView, Order, OrderDir } from "@/features/Tasks/data"
import { useRouteParams } from "@/routing"

function CategoryPage() {
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

export default CategoryPage
