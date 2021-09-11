import * as T from "@effect-ts-app/core/Effect"
import * as EO from "@effect-ts-app/core/EffectOption"
import * as MO from "@effect-ts-app/core/Schema"
import { Parser } from "@effect-ts-app/core/Schema"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { constant, flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { useCallback, useEffect, useMemo } from "react"

import { useServiceContext } from "@/context"
import { useFetch, useModify, useQuery } from "@/data"
import { TodoClient, Todo } from "@/index"

// export function useModifyTasks() {
//   return useModify<A.Array<Todo.Task>>("latestTasks")
// }

// export function useGetTaskList(id: TaskListId) {
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

const fetchMe = constant(TodoClient.Me.index)

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

const fetchLatestTasks = constant(TodoClient.Tasks.all["|>"](T.map((r) => r.items)))

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

const newTask =
  (v: Todo.TaskView | MO.ReasonableString, listId: Todo.TaskListIdU = "inbox") =>
  (newTitle: MO.ReasonableString) =>
    TodoClient.TaskLists.createTask({
      title: newTitle,
      isFavorite: v === "important",
      myDay: v === "my-day" ? O.some(new Date()) : O.none,
      listId,
    })
export function useNewTask(
  v: Todo.TaskView | MO.ReasonableString,
  listId?: Todo.TaskListId
) {
  return useFetch(newTask(v, listId))
}

// export function useFindTaskList(id: TaskListId) {
//   //return useFetch(TodoTemp.findTaskList)
//   const { runWithErrorLog } = useServiceContext()
//   const modify = useModifyTasks()
//   const r = useQuery(`task-list-${id}`, TodoTemp.findTaskList)
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
  return useFetch(TodoClient.Tasks.find)
}

const removeTask = (id: Todo.TaskId) => TodoClient.Tasks.remove({ id })
export function useRemoveTask() {
  return useFetch(removeTask)
}

export function useUpdateTask() {
  return useFetch(TodoClient.Tasks.update)
}

export function useUpdateTask2(id: string) {
  // let's use the refetch for now, but in future make a mutation queue e.g via semaphore
  // or limit to always just 1
  return useQuery(`update-task-${id}`, TodoClient.Tasks.update)
}
export function useModifyTasks() {
  return useModify<A.Array<Todo.Task>>("latestTasks")
}

export function useModifyMe() {
  return useModify<TodoClient.Me.Index.Response>("me")
}

// export function useReorder() {
//   const [tasksResult] = useTasks()
//   const modifyTasks = useModifyTasks()
//   const { runWithErrorLog } = useServiceContext()
//   const tref = useRef(datumEither.isSuccess(tasksResult) ? tasksResult.value.right : [])
//   tref.current = datumEither.isSuccess(tasksResult) ? tasksResult.value.right : []

//   return useCallback(
//     (tid: Todo.TaskId, tlid: NonEmptyString, did: Todo.TaskId) => {
//       const tasks = A.filterMap_(tref.current, (t) => t.listId === tlid)
//       const t = TodoClient.Tasks.find((x) => x.id === tid)!
//       const d = TodoClient.Tasks.find((x) => x.id === did)!
//       const didx = TodoClient.Tasks.findIndex((x) => x === d)
//       const reorder = Todo.updateTaskIndex(t, didx)
//       modifyTasks(reorder)
//       const reorderedTasks = tasks["|>"](reorder)
//       TodoClient.Tasks.updateTaskListOrder({
//         id: tlid as any,
//         order: A.map_(reorderedTasks, (t) => t.id),
//       })["|>"](runWithErrorLog)
//     },
//     [modifyTasks, runWithErrorLog]
//   )
// }

export function useGetTask() {
  const modifyTasks = useModifyTasks()
  const [findResult, findTask] = useFindTask()
  return [
    findResult,
    useCallback(
      (id: Todo.TaskId) =>
        pipe(
          findTask({ id }),
          EO.tap((t) =>
            T.succeedWith(() =>
              modifyTasks((tasks) =>
                pipe(
                  A.findIndex_(tasks, (x) => x.id === t.id),
                  O.chain((i) => A.modifyAt_(tasks, i, constant(t))),
                  O.getOrElse(() => A.snoc_(tasks, t))
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
    editNote,
    removeTaskStep,
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

    removeTaskStep: removeTaskStep(t),
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

export const parseRS = Parser.for(MO.ReasonableString)["|>"](MO.condemnFail)
export const parseRSunsafe = Parser.for(MO.ReasonableString)["|>"](MO.unsafe)

export function useTaskCommands(id: Todo.TaskId) {
  const modifyTasks = useModifyTasks()

  const [updateResult, , updateTask] = useUpdateTask2(id)

  const [findResult, getTask] = useGetTask()

  const funcs = useMemo(() => {
    const refreshTask = (t: { id: Todo.TaskId }) => getTask(t.id)
    const updateAndRefreshTask = (r: TodoClient.Tasks.Update.UpdateTaskRequest) =>
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
          parseRS,
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
        parseRS,
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
        parseRS,
        T.map((v) => t["|>"](Todo.Task.lenses.title.set(v))),
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
          EO.chainEffect(parseRS),
          T.chain((note) => updateAndRefreshTask({ id: t.id, note }))
        )
    }

    function removeTaskStep(t: Todo.Task) {
      return (s: Todo.Step) =>
        pipe(
          T.succeedWith(() => t["|>"](Todo.Task.removeStep(s))),
          T.chain(updateAndRefreshTask)
        )
    }

    return {
      removeTaskStep,
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

export * from "@/Todo"
