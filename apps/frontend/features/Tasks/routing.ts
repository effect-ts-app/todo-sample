import * as O from "@effect-ts/core/Option"
import { useRouter } from "next/router"
import { useMemo, useRef } from "react"

import { makeQueryString } from "@/utils"

import { OrderDir, Orders, Ordery } from "./data"

import * as S from "@effect-ts-demo/core/ext/Schema"

export function useRouting(category: S.NonEmptyString, order: O.Option<Ordery>) {
  const r = useRouter()

  // the functions are not stable when order direction, order, or category changes...
  // so we work around it with a ref. alternative would be reparsing and replacing the location.
  const s = useRef({ category, order, push: r.push })
  s.current = { category, order, push: r.push }

  return useMemo(
    () => ({
      setDirection: (dir: OrderDir) =>
        s.current.push(
          `${location.pathname}${makeSearch(
            O.map_(s.current.order, (o) => ({ ...o, dir }))
          )}`
        ),

      setSelectedTaskId: (id: Todo.TaskId | null) =>
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
}

function makeSearch(o: O.Option<Ordery>) {
  return makeQueryString({
    order: o["|>"](O.map((o) => o.kind))["|>"](O.toUndefined),
    orderDirection: o["|>"](O.map((o) => o.dir))["|>"](O.toUndefined),
  })
}
