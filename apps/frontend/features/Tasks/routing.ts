import * as O from "@effect-ts/core/Option"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { useRouter } from "next/router"
import { useMemo, useRef } from "react"

import { makeQueryString } from "@/utils"

import { OrderDir, Orders, TaskView } from "./data"

export function useRouting(
  category: TaskView,
  order: O.Option<Orders>,
  orderDirection: O.Option<OrderDir>
) {
  const r = useRouter()

  // the functions are not stable when order direction, order, or category changes...
  // so we work around it with a ref. alternative would be reparsing and replacing the location.
  const s = useRef({ category, order, orderDirection, push: r.push })
  s.current = { category, order, orderDirection, push: r.push }

  const { setDirection, setOrder, setSelectedTaskId } = useMemo(
    () => ({
      setDirection: (dir: OrderDir) =>
        s.current.push(
          `${location.pathname}${makeSearch(s.current.order, O.some(dir))}`
        ),

      setSelectedTaskId: (id: UUID | null) =>
        s.current.push(
          `/${s.current.category}${id ? `/${id}` : ""}${makeSearch(
            s.current.order,
            s.current.orderDirection
          )}`
        ),

      setOrder: (o: O.Option<Orders>) =>
        s.current.push(
          `${location.pathname}${makeSearch(o, s.current.orderDirection)}`
        ),
    }),
    []
  )

  return {
    setDirection,
    setOrder,
    setSelectedTaskId,
  }
}

function makeSearch(o: O.Option<Orders>, dir: O.Option<OrderDir>) {
  return makeQueryString({
    order: O.toUndefined(o),
    orderDirection: o["|>"](O.zipSecond(dir))["|>"](O.toUndefined),
  })
}
