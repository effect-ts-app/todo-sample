import { useRouter } from "next/router"
import React from "react"

import TasksScreen, { getQueryParam } from "@/components/Tasks/TasksScreen"

const Category = () => {
  const r = useRouter()
  return (
    <TasksScreen
      category={getQueryParam(r.query, "category")!}
      order={getQueryParam(r.query, "order")}
      orderDirection={getQueryParam(r.query, "orderDirection")}
      taskId={null}
    />
  )
}

export default Category
