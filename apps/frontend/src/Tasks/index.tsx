import * as TodoClient from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts-demo/todo-types/ext/Effect"
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as A from "@effect-ts/core/Array"
import { constant, flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Lens } from "@effect-ts/monocle"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { Box } from "@material-ui/core"
import Refresh from "@material-ui/icons/Refresh"
import { datumEither } from "@nll/datum"
import React, { memo, useCallback, useEffect, useMemo } from "react"
import { useHistory, Route } from "react-router"
import { Link } from "react-router-dom"
import styled from "styled-components"
import useInterval from "use-interval"

import { useServiceContext } from "../context"
import { useFetch, useModify, useQuery } from "../data"

import TaskDetail from "./TaskDetail"
import TaskList from "./TaskList"
import * as Todo from "./Todo"
import { toUpperCaseFirst, withLoading } from "./utils"

type TaskView = "tasks" | "favorites"

function filterByCategory(category: TaskView) {
  return A.filter((t: Todo.Task) => category !== "favorites" || t.isFavorite)
}

const fetchLatestTasks = constant(
  TodoClient.Tasks.getTasks["|>"](T.map((r) => A.reverse(r.tasks)))
)

function useTasks() {
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

const newTask = (isFavorite: boolean) => (newTitle: string) =>
  TodoClient.Tasks.createTaskE({ title: newTitle, isFavorite })

function useNewTask(isFavorite: boolean) {
  return useFetch(newTask(isFavorite))
}

function useFindTask() {
  return useFetch(TodoClient.Tasks.findTask)
}

const deleteTask = (id: UUID) => TodoClient.Tasks.deleteTask({ id })
function useDeleteTask() {
  return useFetch(deleteTask)
}

function useUpdateTask() {
  return useFetch(TodoClient.Tasks.updateTask)
}

function useUpdateTask2(id: string) {
  // let's use the refetch for now, but in future make a mutation queue e.g via semaphore
  // or limit to always just 1
  return useQuery(`update-task-${id}`, TodoClient.Tasks.updateTask)
}

const LinkBox = styled(Box)`
  > * {
    display: block;
  }
`

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

export function useFuncs(id: UUID) {
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
          T.map(Todo.Task.updateStep(t)(s)),
          T.chain(updateAndRefreshTask)
        )
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
      toggleTaskFavorite,
      toggleTaskChecked,
      modifyTasks,
    }
  }, [getTask, modifyTasks, updateTask])

  return {
    ...funcs,
    findResult,
    updateResult,
  }
}

export type Funcs = ReturnType<typeof useFuncs>

export const Tasks = memo(function Tasks({
  category,
  tasks: unfilteredTasks,
}: {
  category: TaskView
  tasks: A.Array<Todo.Task>
}) {
  const filter = filterByCategory(category)
  const tasks = filter(unfilteredTasks)

  const { runPromise } = useServiceContext()
  const [tasksResult, , refetchTasks] = useTasks()
  const [newResult, addNewTask] = useNewTask(category === "favorites")

  useInterval(() => refetchTasks, 30 * 1000)

  const h = useHistory()
  const setSelectedTaskId = useCallback((id: UUID) => h.push(`/${category}/${id}`), [
    category,
    h,
  ])

  const [findResult, getTask] = useGetTask()

  const isRefreshing = datumEither.isRefresh(tasksResult)

  return (
    <Box display="flex" height="100%">
      <LinkBox
        flexBasis="200px"
        style={{ backgroundColor: "#efefef" }}
        paddingX={1}
        paddingTop={7}
        paddingBottom={2}
      >
        <Link to="/tasks">Tasks</Link>
        <Link to="/favorites">Favorites</Link>
        {/* <Link to="/my-day">my day</Link> */}
      </LinkBox>

      <Box flexGrow={1} paddingX={2} paddingBottom={2}>
        <h1>
          {toUpperCaseFirst(category)} {isRefreshing && <Refresh />}
        </h1>

        {/* TODO: The loading state must be per Task, but still shared across views based via the tasks-{id} */}
        <TaskList
          tasks={tasks}
          setSelectedTask={(t: Todo.Task) => setSelectedTaskId(t.id)}
          addTask={withLoading(
            flow(
              addNewTask,
              T.chain((r) => getTask(r.id)),
              EO.map((t) => setSelectedTaskId(t.id)),
              runPromise
            ),
            // TODO: or refreshing
            datumEither.isPending(newResult) || datumEither.isPending(findResult)
          )}
        />
      </Box>

      <Route
        path={`/${category}/:id`}
        render={({
          match: {
            params: { id },
          },
        }) => {
          const t = tasks.find((x) => x.id === id)
          return t && <SelectedTask task={t} />
        }}
      />
    </Box>
  )
})

const SelectedTask_ = ({ task: t }: { task: Todo.Task }) => {
  const { runPromise } = useServiceContext()
  const [deleteResult, deleteTask] = useDeleteTask()
  const {
    addNewTaskStep,
    deleteTaskStep,
    editNote,
    findResult,
    modifyTasks,
    setDue,
    setReminder,
    setTitle,
    toggleTaskChecked,
    toggleTaskFavorite,
    toggleTaskStepChecked,
    updateResult,
    updateStepTitle,
  } = useFuncs(t.id)

  const isRefreshingTask = datumEither.isRefresh(findResult)
  const isUpdatingTask = datumEither.isPending(updateResult) || isRefreshingTask

  return (
    <Box
      display="flex"
      flexBasis="300px"
      paddingX={2}
      paddingTop={2}
      paddingBottom={1}
      style={{ backgroundColor: "#efefef", width: "400px" }}
    >
      <TaskDetail
        task={t}
        deleteTask={withLoading(
          () =>
            pipe(
              deleteTask(t.id),
              T.map(() =>
                modifyTasks((tasks) =>
                  A.unsafeDeleteAt_(
                    tasks,
                    tasks.findIndex((x) => x.id === t.id)
                  )
                )
              ),
              runPromise
            ),
          datumEither.isPending(deleteResult)
        )}
        toggleChecked={withLoading(
          () => toggleTaskChecked(t)["|>"](runPromise),
          isUpdatingTask
        )}
        toggleFavorite={withLoading(
          () => toggleTaskFavorite(t)["|>"](runPromise),
          isUpdatingTask
        )}
        toggleStepChecked={withLoading(
          flow(toggleTaskStepChecked(t), runPromise),
          isUpdatingTask
        )}
        setTitle={withLoading(flow(setTitle(t), runPromise), isUpdatingTask)}
        setDue={withLoading(flow(setDue(t), runPromise), isUpdatingTask)}
        setReminder={withLoading(flow(setReminder(t), runPromise), isUpdatingTask)}
        editNote={withLoading(flow(editNote(t), runPromise), isUpdatingTask)}
        addNewStep={withLoading(
          flow(addNewTaskStep(t), T.asUnit, runPromise),
          isUpdatingTask
        )}
        updateStepTitle={withLoading(
          (s: Todo.Step) => flow(updateStepTitle(t)(s), T.asUnit, runPromise),
          isUpdatingTask
        )}
        deleteStep={withLoading(flow(deleteTaskStep(t), runPromise), isUpdatingTask)}
      />
    </Box>
  )
}

const SelectedTask = memo(SelectedTask_)

function TasksScreen_({ category }: { category: string }) {
  const [tasksResult] = useTasks()
  // testing for multi-call relying on same network-call/cache.
  //   useTasks()
  //   useTasks()

  return tasksResult["|>"](
    datumEither.fold(
      () => <div>Hi there... about to get us some Tasks</div>,
      () => <div>Getting us some tasks now..</div>,
      (err) => <>{"Error Refreshing tasks: " + JSON.stringify(err)}</>,
      (tasks) => <Tasks tasks={tasks} category={category as TaskView} />,
      (err) => <>{"Error Loading tasks: " + JSON.stringify(err)}</>,
      (tasks) => <Tasks tasks={tasks} category={category as TaskView} />
    )
  )
}
const TasksScreen = memo(TasksScreen_)

export default TasksScreen
