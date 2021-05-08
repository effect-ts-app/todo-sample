import * as O from "@effect-ts/core/Option"
import React from "react"

import { Order, OrderDir } from "@/Todo"
import { useMemo } from "@/data"
import TasksScreen from "@/features/Tasks"
import { useRouteParams } from "@/routing"

function HomePage() {
  const { order, orderDirection } = useRouteParams({
    order: Order,
    orderDirection: OrderDir,
  })
  const o = useMemo(() => {
    return O.map_(order, (kind) => ({
      kind,
      dir: orderDirection["|>"](O.getOrElse(() => "up" as const)),
    }))
  }, [order, orderDirection])
  return <TasksScreen category={O.none} order={o} taskId={O.none} />
}

// disable static generation :/
export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  }
}

export default HomePage
