import { ParsedUrlQuery } from "querystring"

import * as TodoClient from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts-demo/todo-types/ext/Effect"
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { constant, flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import * as Sy from "@effect-ts/core/Sync"
import { EnforceNonEmptyRecord } from "@effect-ts/core/Utils"
import { Lens } from "@effect-ts/monocle"
import { AType, M, make } from "@effect-ts/morphic"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { decode } from "@effect-ts/morphic/Decoder"
import { useRouter } from "next/router"
import { useCallback, useEffect, useMemo } from "react"

import * as Todo from "@/Todo"
import { useServiceContext } from "@/context"
import { useFetch, useModify, useQuery } from "@/data"

import { typedKeysOf } from "./utils"

const fetchLatestTasks = constant(
  TodoClient.Tasks.getTasks["|>"](T.map((r) => r.tasks))
)

export function useTasks() {
  const { runWithErrorLog } = useServiceContext()
  const r = useQuery("latestTasks", fetchLatestTasks)
  const [, , , exec] = r

  useEffect(() => {
    const cancel = exec()["|>"](runWithErrorLog)
    return () => {
      cancel()
    }
  }, [exec, runWithErrorLog])
  return r
}

const newTask = (v: TaskView) => (newTitle: string) =>
  TodoClient.Tasks.createTaskE({
    title: newTitle,
    isFavorite: false,
    myDay: null,
    ...(v === "important"
      ? { isFavorite: true }
      : v === "my-day"
      ? { myDay: new Date().toISOString() }
      : {}),
  })

export function makeKeys<T extends string>(a: readonly T[]) {
  return a.reduce((prev, cur) => {
    prev[cur] = null
    return prev
  }, {} as { [P in typeof a[number]]: null })
}

export const TaskViews = ["tasks", "important", "my-day"] as const
export const TaskView = make((F) => F.keysOf(makeKeys(TaskViews)))
export type TaskView = AType<typeof TaskView>

// category = list = per route. throw 404 when missing.
// taskId per route
// order and order direction

export const parseOption = <E, A>(t: M<{}, E, A>) => {
  const dec = decode(t)
  return (_: E) => dec(_)["|>"](Sy.runEither)["|>"](O.fromEither)
}

export function useNewTask(v: TaskView) {
  return useFetch(newTask(v))
}

export function useFindTask() {
  return useFetch(TodoClient.Tasks.findTask)
}

const deleteTask = (id: UUID) => TodoClient.Tasks.deleteTask({ id })
export function useDeleteTask() {
  return useFetch(deleteTask)
}

export function useUpdateTask() {
  return useFetch(TodoClient.Tasks.updateTask)
}

export function useUpdateTask2(id: string) {
  // let's use the refetch for now, but in future make a mutation queue e.g via semaphore
  // or limit to always just 1
  return useQuery(`update-task-${id}`, TodoClient.Tasks.updateTask)
}
export function useModifyTasks() {
  return useModify<A.Array<Todo.Task>>("latestTasks")
}

export function useGetTask() {
  const modifyTasks = useModifyTasks()
  const [findResult, findTask] = useFindTask()
  return [
    findResult,
    useCallback(
      (id: UUID) =>
        pipe(
          findTask(id),
          EO.tap((t) =>
            T.effectTotal(() =>
              modifyTasks((tasks) =>
                pipe(
                  A.findIndex_(tasks, (x) => x.id === t.id),
                  O.chain((i) => A.modifyAt_(tasks, i, constant(t))),
                  O.getOrElse(() => A.cons_(tasks, t))
                )
              )
            )
          )
        ),
      [findTask, modifyTasks]
    ),
  ] as const
}

export function useTaskCommands(id: UUID) {
  const modifyTasks = useModifyTasks()

  const [updateResult, , updateTask] = useUpdateTask2(id)

  const [findResult, getTask] = useGetTask()

  const funcs = useMemo(() => {
    const refreshTask = (t: { id: UUID }) => getTask(t.id)
    const updateAndRefreshTask = (r: TodoClient.Tasks.UpdateTask.Request) =>
      pipe(updateTask(r), T.zipRight(refreshTask(r)))

    function toggleTaskChecked(t: Todo.Task) {
      return pipe(
        T.effectTotal(() => t["|>"](Todo.Task.toggleCompleted)),
        T.chain(updateAndRefreshTask)
      )
    }

    function toggleTaskMyDay(t: Todo.Task) {
      return pipe(
        T.effectTotal(() => t["|>"](Todo.Task.toggleMyDay)),
        T.chain(updateAndRefreshTask)
      )
    }

    function toggleTaskFavorite(t: Todo.Task) {
      return pipe(
        T.effectTotal(() => Todo.Task.toggleFavorite(t)),
        T.tap(updateTask),
        T.chain(refreshTask)
      )
    }

    function updateStepTitle(t: Todo.Task) {
      return (s: Todo.Step) =>
        flow(
          NonEmptyString.parse,
          T.map((stepTitle) => t["|>"](Todo.Task.updateStep(s, stepTitle))),
          T.chain(updateAndRefreshTask)
        )
    }

    function updateStepIndex(t: Todo.Task) {
      return (s: Todo.Step) => (newIndex: number) => {
        const updatedTask = t["|>"](Todo.Task.updateStepIndex(s, newIndex))
        modifyTasks(A.map((_) => (_.id === t.id ? updatedTask : _)))
        return updateAndRefreshTask(updatedTask)
      }
    }

    function toggleTaskStepChecked(t: Todo.Task) {
      return (s: Todo.Step) =>
        pipe(
          T.effectTotal(() => t["|>"](Todo.Task.toggleStepCompleted(s))),
          T.chain(updateAndRefreshTask)
        )
    }

    function addNewTaskStep(t: Todo.Task) {
      return flow(
        NonEmptyString.parse,
        T.map((title) => t["|>"](Todo.Task.addStep(title))),
        T.chain(updateAndRefreshTask)
      )
    }

    function setDue(t: Todo.Task) {
      return (date: Date | null) =>
        pipe(
          EO.fromNullable(date),
          T.chain((due) => updateAndRefreshTask({ id: t.id, due }))
        )
    }

    function setTitle(t: Todo.Task) {
      return flow(
        NonEmptyString.parse,
        T.map((v) => t["|>"](Todo.Task.lens["|>"](Lens.prop("title")).set(v))),
        T.chain(updateAndRefreshTask)
      )
    }

    function setReminder(t: Todo.Task) {
      return (date: Date | null) =>
        pipe(
          EO.fromNullable(date),
          T.chain((reminder) => updateAndRefreshTask({ id: t.id, reminder }))
        )
    }

    function editNote(t: Todo.Task) {
      return (note: string | null) =>
        pipe(
          EO.fromNullable(note),
          EO.chain(flow(NonEmptyString.parse, EO.fromEffect)),
          T.chain((note) => updateAndRefreshTask({ id: t.id, note }))
        )
    }

    function deleteTaskStep(t: Todo.Task) {
      return (s: Todo.Step) =>
        pipe(
          T.effectTotal(() => t["|>"](Todo.Task.deleteStep(s))),
          T.chain(updateAndRefreshTask)
        )
    }

    return {
      deleteTaskStep,
      editNote,
      setReminder,
      setTitle,
      setDue,
      addNewTaskStep,
      toggleTaskStepChecked,
      updateStepTitle,
      updateStepIndex,
      toggleTaskFavorite,
      toggleTaskChecked,
      toggleTaskMyDay,
      modifyTasks,
    }
  }, [getTask, modifyTasks, updateTask])

  return {
    ...funcs,
    findResult,
    updateResult,
  }
}

export type TaskCommands = ReturnType<typeof useTaskCommands>

const defaultDate = constant(new Date(1900, 1, 1))

export const orders = {
  creation: ORD.contramap_(ORD.date, (t: Todo.Task) => t.createdAt),
  important: ORD.contramap_(ORD.inverted(ORD.boolean), (t: Todo.Task) => t.isFavorite),
  alphabetically: ORD.contramap_(ORD.string, (t: Todo.Task) => t.title.toLowerCase()),
  due: ORD.contramap_(ORD.inverted(ORD.date), (t: Todo.Task) =>
    O.getOrElse_(t.due, defaultDate)
  ),
  myDay: ORD.contramap_(ORD.inverted(ORD.date), (t: Todo.Task) =>
    O.getOrElse_(t.myDay, defaultDate)
  ),
}

export type Orders = keyof typeof orders

const order = typedKeysOf(orders)
export const Order = make((F) => F.keysOf(makeKeys(order)))
export type Order = AType<typeof Order>

const orderDir = ["up", "down"] as const
export const OrderDir = make((F) => F.keysOf(makeKeys(orderDir)))
export type OrderDir = AType<typeof OrderDir>

export function getQueryParam(search: ParsedUrlQuery, param: string) {
  const v = search[param]
  if (Array.isArray(v)) {
    return v[0]
  }
  return v ?? null
}

export const getQueryParamO = flow(getQueryParam, O.fromNullable)

export const useRouteParam = <A>(t: M<{}, string, A>, key: string) => {
  const r = useRouter()
  return getQueryParamO(r.query, key)["|>"](O.chain(parseOption(t)))
}

export const useRouteParams = <NER extends Record<string, M<{}, string, any>>>(
  t: NER // enforce non empty
): {
  [K in keyof NER]: O.Option<AType<NER[K]>>
} => {
  const r = useRouter()
  return typedKeysOf(t).reduce(
    (prev, cur) => {
      prev[cur] = getQueryParamO(r.query, cur as string)["|>"](
        O.chain(parseOption(t[cur]))
      )
      return prev
    },
    {} as {
      [K in keyof NER]: AType<NER[K]>
    }
  )
}
