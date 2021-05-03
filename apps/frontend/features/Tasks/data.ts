import * as TodoClient from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { constant, flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { Lens } from "@effect-ts/monocle"
import { AType, make } from "@effect-ts/morphic"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { datumEither } from "@nll/datum"
import { useCallback, useEffect, useMemo, useRef } from "react"

import * as Todo from "@/Todo"
import { useServiceContext } from "@/context"
import { useFetch, useModify, useQuery } from "@/data"
import { typedKeysOf } from "@/utils"

import * as T from "@effect-ts-demo/core/ext/Effect"
import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import { TaskId } from "@effect-ts-demo/todo-types/Task"

// export function useModifyTasks() {
//   return useModify<A.Array<Todo.Task>>("latestTasks")
// }

// export function useGetTaskList(id: UUID) {
//   //const modifyTasks = useModifyTasks()
//   const [findResult, findTaskList] = useFindTaskList()
//   return [
//     findResult,
//     useCallback(
//       (id: UUID) =>
//         pipe(
//           findTaskList(id)
//           //   EO.tap((t) =>
//           //     T.succeedWith(() =>
//           //       modifyTasks((tasks) =>
//           //         pipe(
//           //           A.findIndex_(tasks, (x) => x.id === t.id),
//           //           O.chain((i) => A.modifyAt_(tasks, i, constant(t))),
//           //           O.getOrElse(() => A.cons_(tasks, t))
//           //         )
//           //       )
//           //     )
//           //   )
//         ),
//       [findTaskList] // , modifyTasks
//     ),
//   ] as const
// }

const fetchMe = constant(TodoClient.Temp.getMe)

export function useMe() {
  const { runWithErrorLog } = useServiceContext()
  const r = useQuery("me", fetchMe)
  const [, , , exec] = r

  useEffect(() => {
    const cancel = exec()["|>"](runWithErrorLog)
    return () => {
      cancel()
    }
  }, [exec, runWithErrorLog])
  return r
}

const fetchLatestTasks = constant(
  TodoClient.Tasks.getTasks["|>"](T.map((r) => r.items))
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

const newTask = (v: TaskView, folderId?: Todo.TaskListId) => (newTitle: string) =>
  TodoClient.Tasks.createTaskE({
    title: newTitle,
    isFavorite: false,
    myDay: null,
    folderId: folderId ?? "inbox",
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

export const TaskViews = ["important", "my-day"] as const
export const TaskView = make((F) => F.keysOf(makeKeys(TaskViews)))
export type TaskView = AType<typeof TaskView>

export function useNewTask(v: TaskView, folderId?: Todo.TaskListId) {
  return useFetch(newTask(v, folderId))
}

// export function useFindTaskList(id: UUID) {
//   //return useFetch(TodoClient.Temp.findTaskList)
//   const { runWithErrorLog } = useServiceContext()
//   const modify = useModifyTasks()
//   const r = useQuery(`task-list-${id}`, TodoClient.Temp.findTaskList)
//   const [result, , , exec] = r
//   useEffect(() => {
//     const cancel = exec(id)["|>"](runWithErrorLog)
//     return () => {
//       cancel()
//     }
//   }, [id, exec, runWithErrorLog])
//   useEffect(() => {
//     if (datumEither.isSuccess(result)) {
//       modify(A.concat(result.value.right.items))
//     }
//   }, [modify, result._tag])
//   return r
// }

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

export function useReorder() {
  const [tasksResult] = useTasks()
  const modifyTasks = useModifyTasks()
  const { runWithErrorLog } = useServiceContext()
  const tref = useRef(datumEither.isSuccess(tasksResult) ? tasksResult.value.right : [])
  tref.current = datumEither.isSuccess(tasksResult) ? tasksResult.value.right : []

  return useCallback(
    (tid: TaskId, did: TaskId) => {
      const tasks = tref.current
      const t = tasks.find((x) => x.id === tid)!
      const d = tasks.find((x) => x.id === did)!
      const didx = tasks.findIndex((x) => x === d)
      const reorder = Todo.updateTaskIndex(t, didx)
      modifyTasks(reorder)
      const reorderedTasks = tasks["|>"](reorder)
      TodoClient.Tasks.setTasksOrder({
        order: A.map_(reorderedTasks, (t) => t.id),
      })["|>"](runWithErrorLog)
    },
    [modifyTasks, runWithErrorLog]
  )
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
            T.succeedWith(() =>
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

export function useTaskCommandsResolved(t: Todo.Task) {
  const {
    addNewTaskStep,
    deleteTaskStep,
    editNote,
    setDue,
    setReminder,
    setTitle,
    toggleTaskChecked,
    toggleTaskFavorite,
    toggleTaskMyDay,
    toggleTaskStepChecked,
    updateStepIndex,
    updateStepTitle,
    ...rest
  } = useTaskCommands(t.id)

  return {
    ...rest,

    deleteTaskStep: deleteTaskStep(t),
    editNote: editNote(t),
    setReminder: setReminder(t),
    setTitle: setTitle(t),
    setDue: setDue(t),
    addNewTaskStep: addNewTaskStep(t),
    toggleTaskStepChecked: toggleTaskStepChecked(t),
    updateStepTitle: updateStepTitle(t),
    updateStepIndex: updateStepIndex(t),
    toggleTaskFavorite: toggleTaskFavorite(t),
    toggleTaskChecked: toggleTaskChecked(t),
    toggleTaskMyDay: toggleTaskMyDay(t),
  }
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
        T.succeedWith(() => t["|>"](Todo.Task.toggleCompleted)),
        T.chain(updateAndRefreshTask)
      )
    }

    function toggleTaskMyDay(t: Todo.Task) {
      return pipe(
        T.succeedWith(() => t["|>"](Todo.Task.toggleMyDay)),
        T.chain(updateAndRefreshTask)
      )
    }

    function toggleTaskFavorite(t: Todo.Task) {
      return pipe(
        T.succeedWith(() => Todo.Task.toggleFavorite(t)),
        T.tap(updateTask),
        T.chain(refreshTask)
      )
    }

    function updateStepTitle(t: Todo.Task) {
      return (s: Todo.Step) =>
        flow(
          NonEmptyString.parse_,
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
          T.succeedWith(() => t["|>"](Todo.Task.toggleStepCompleted(s))),
          T.chain(updateAndRefreshTask)
        )
    }

    function addNewTaskStep(t: Todo.Task) {
      return flow(
        NonEmptyString.parse_,
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
        NonEmptyString.parse_,
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
          EO.chain(flow(NonEmptyString.parse_, EO.fromEffect)),
          T.chain((note) => updateAndRefreshTask({ id: t.id, note }))
        )
    }

    function deleteTaskStep(t: Todo.Task) {
      return (s: Todo.Step) =>
        pipe(
          T.succeedWith(() => t["|>"](Todo.Task.deleteStep(s))),
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

export const Ordery = make((F) =>
  F.interface({
    kind: Order(F),
    dir: OrderDir(F),
  })
)
export type Ordery = AType<typeof Ordery>

export function filterByCategory(category: TaskView | string) {
  switch (category) {
    case "important":
      return A.filter((t: Todo.Task) => t.isFavorite)
    case "my-day": {
      const isToday = isSameDay(new Date())
      return A.filter((t: Todo.Task) =>
        t.myDay["|>"](O.map(isToday))["|>"](O.getOrElse(() => false))
      )
    }
    case "tasks": {
      return A.filter((t: Todo.Task) => t.listId === "inbox")
    }
    default:
      return A.filter((t: Todo.Task) => t.listId === category)
  }
}

function isSameDay(today: Date) {
  return (someDate: Date) => {
    return (
      someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
    )
  }
}

export const emptyTasks = [] as readonly Todo.Task[]
