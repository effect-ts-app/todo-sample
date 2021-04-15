import * as O from "@effect-ts/core/Option"
import React from "react"

import { useMemo } from "@/data"
import TasksScreen from "@/features/Tasks"
import { TaskView, Order, OrderDir } from "@/features/Tasks/data"
import { useRouteParams } from "@/routing"

function CategoryPage() {
  const { category, order, orderDirection } = useRouteParams({
    category: TaskView,
    order: Order,
    orderDirection: OrderDir,
  })
  const o = useMemo(() => {
    return O.map_(order, (kind) => ({
      kind,
      dir: orderDirection["|>"](O.getOrElse(() => "up" as const)),
    }))
  }, [order, orderDirection])
  return <TasksScreen category={category} order={o} taskId={O.none} />
}

export default CategoryPage
