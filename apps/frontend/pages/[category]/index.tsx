import * as O from "@effect-ts/core/Option"
import React from "react"

import { useMemo } from "@/data"
import TasksScreen from "@/features/Tasks"
import { Order, OrderDir } from "@/features/Tasks/data"
import { useRouteParams } from "@/routing"

import * as S from "@effect-ts-demo/core/ext/Schema"

function CategoryPage() {
  const { category, order, orderDirection } = useRouteParams({
    category: S.nonEmptyString,
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

// disable static generation :/
export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  }
}

export default CategoryPage
