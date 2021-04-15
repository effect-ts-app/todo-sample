import * as O from "@effect-ts/core/Option"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { useRouter } from "next/router"
import { useMemo, useRef } from "react"

import { makeQueryString } from "@/utils"

import { OrderDir, Orders, Ordery, TaskView } from "./data"

export function useRouting(category: TaskView, order: O.Option<Ordery>) {
  const r = useRouter()

  // the functions are not stable when order direction, order, or category changes...
  // so we work around it with a ref. alternative would be reparsing and replacing the location.
  const s = useRef({ category, order, push: r.push })
  s.current = { category, order, push: r.push }

  const { setDirection, setOrder, setSelectedTaskId } = useMemo(
    () => ({
      setDirection: (dir: OrderDir) =>
        s.current.push(
          `${location.pathname}${makeSearch(
            O.map_(s.current.order, (o) => ({ ...o, dir }))
          )}`
        ),

      setSelectedTaskId: (id: UUID | null) =>
        s.current.push(
          `/${s.current.category}${id ? `/${id}` : ""}${makeSearch(s.current.order)}`
        ),

      setOrder: (o: O.Option<Orders>) =>
        s.current.push(
          `${location.pathname}${makeSearch(
            O.map_(o, (kind) => ({ kind, dir: "up" }))
          )}`
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

function makeSearch(o: O.Option<Ordery>) {
  return makeQueryString({
    order: o["|>"](O.map((o) => o.kind))["|>"](O.toUndefined),
    orderDirection: o["|>"](O.map((o) => o.dir))["|>"](O.toUndefined),
  })
}
