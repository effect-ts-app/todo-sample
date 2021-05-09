import * as O from "@effect-ts/core/Option"
import React from "react"

import { useMemo } from "@/data"
import TasksScreen from "@/features/Tasks"
import { Order, OrderDir } from "@/features/Tasks/data"
import { Todo } from "@/index"
import { useRouteParams } from "@/routing"

function TasksPage() {
  const { category, order, orderDirection, tasks: taskId } = useRouteParams({
    category: Todo.Category,
    order: Order,
    orderDirection: OrderDir,
    tasks: Todo.TaskId,
  })
  const o = useMemo(() => {
    return O.map_(order, (kind) => ({
      kind,
      dir: orderDirection["|>"](O.getOrElse(() => "up" as const)),
    }))
  }, [order, orderDirection])
  return <TasksScreen category={category} order={o} taskId={taskId} />
}

// disable static generation :/
export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  }
}

export default TasksPage
