import * as TodoClient from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts-demo/todo-types/ext/Effect"
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as A from "@effect-ts/core/Array"
import { constant, flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Lens } from "@effect-ts/monocle"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { Box, Container } from "@material-ui/core"
import { datumEither } from "@nll/datum"
import React, { useEffect } from "react"
import { useHistory, Route, useRouteMatch } from "react-router"
import { Link } from "react-router-dom"
import styled from "styled-components"

import { useServiceContext } from "../context"
import { useFetch, useQuery } from "../data"

import TaskDetail from "./TaskDetail"
import TaskList from "./TaskList"
import * as Todo from "./Todo"
import { withLoading } from "./utils"

const fetchLatestTasks = constant(
  TodoClient.Tasks.getTasks["|>"](T.map((r) => A.reverse(r.tasks)))
)

function useTasks() {
  const { runWithErrorLog } = useServiceContext()
  const [result, lastSuccess, refetch, exec] = useQuery("latestTasks", fetchLatestTasks)

  useEffect(() => {
    const cancel = exec()["|>"](runWithErrorLog)
    return () => {
      cancel()
    }
  }, [exec, runWithErrorLog])
  return [result, lastSuccess, refetch] as const
}

const newTask = (isFavorite: boolean) => (newTitle: string) =>
  TodoClient.Tasks.createTaskE({ title: newTitle, isFavorite })

function useNewTask(isFavorite: boolean) {
  return useFetch(newTask(isFavorite))
}

const deleteTask = (id: UUID) => TodoClient.Tasks.deleteTask({ id })
function useDeleteTask() {
  return useFetch(deleteTask)
}

function useUpdateTask() {
  return useFetch(TodoClient.Tasks.updateTask)
}

const Loading = styled.div`
  position: fixed;
`

const LinkContainer = styled(Container)`
  > * {
    display: block;
  }
`

function Tasks({ tasks }: { tasks: A.Array<Todo.Task> }) {
  const {
    params: { category },
  } = useRouteMatch<{ category: "tasks" | "favorites" }>()

  const { runPromise } = useServiceContext()
  const [tasksResult, , refetchTasks] = useTasks()
  const [newResult, addNewTask] = useNewTask(category === "favorites")
  const [deleteResult, deleteTask] = useDeleteTask()
  const [updateResult, updateTask] = useUpdateTask()

  const h = useHistory()
  const setSelectedTaskId = (id: UUID) => h.push(`/${category}/${id}`)

  function toggleTaskChecked(t: Todo.Task) {
    return pipe(
      T.effectTotal(() => t["|>"](Todo.Task.toggleCompleted)),
      T.chain(updateTask),
      T.zipRight(refetchTasks())
    )
  }

  function toggleTaskFavorite(t: Todo.Task) {
    return pipe(
      T.effectTotal(() => Todo.Task.toggleFavorite(t)),
      T.chain(updateTask),
      T.zipRight(refetchTasks())
    )
  }

  function updateStepTitle(t: Todo.Task) {
    return (s: Todo.Step) =>
      flow(
        NonEmptyString.parse,
        T.map(Todo.Task.updateStep(t)(s)),
        T.chain(updateTask),
        T.zipRight(refetchTasks())
      )
  }

  function toggleTaskStepChecked(t: Todo.Task) {
    return (s: Todo.Step) =>
      pipe(
        T.effectTotal(() => t["|>"](Todo.Task.toggleStepCompleted(s))),
        T.chain(updateTask),
        T.zipRight(refetchTasks())
      )
  }

  function addNewTaskStep(t: Todo.Task) {
    return flow(
      NonEmptyString.parse,
      T.map((title) => t["|>"](Todo.Task.addStep(title))),
      T.chain(updateTask),
      T.zipRight(refetchTasks()["|>"](T.forkDaemon))
    )
  }

  function setDue(t: Todo.Task) {
    return (date: Date | null) =>
      pipe(
        O.fromNullable(date),
        EO.fromOption,
        T.chain((due) => updateTask({ id: t.id, due })),
        T.zipRight(refetchTasks())
      )
  }

  function setTitle(t: Todo.Task) {
    return flow(
      NonEmptyString.parse,
      T.map((v) => t["|>"](Todo.Task.lens["|>"](Lens.prop("title")).set(v))),
      T.chain(updateTask),
      T.zipRight(refetchTasks())
    )
  }

  function setReminder(t: Todo.Task) {
    return (date: Date | null) =>
      pipe(
        O.fromNullable(date),
        EO.fromOption,
        T.chain((reminder) => updateTask({ id: t.id, reminder })),
        T.zipRight(refetchTasks())
      )
  }

  function editNote(t: Todo.Task) {
    return (note: string | null) =>
      pipe(
        O.fromNullable(note),
        EO.fromOption,
        EO.chain(flow(NonEmptyString.parse, EO.fromEffect)),
        T.chain((note) => updateTask({ id: t.id, note })),
        T.zipRight(refetchTasks())
      )
  }

  function deleteTaskStep(t: Todo.Task) {
    return (s: Todo.Step) =>
      pipe(
        T.effectTotal(() => t["|>"](Todo.Task.deleteStep(s))),
        T.chain(updateTask),
        T.zipRight(refetchTasks())
      )
  }

  const isRefreshing = datumEither.isRefresh(tasksResult)
  const isUpdatingTask = datumEither.isPending(updateResult)

  return (
    <Box display="flex" style={{ height: "100%" }}>
      <Box flexBasis="200px" style={{ height: "100%", backgroundColor: "#efefef" }}>
        <LinkContainer>
          <Link to="/tasks">Tasks</Link>
          <Link to="/favorites">Favorites</Link>
          {/* <Link to="/my-day">my day</Link> */}
        </LinkContainer>
      </Box>
      <Box flexGrow={1}>
        <Container>
          <div>
            <h1>Tasks</h1>
          </div>
          {isRefreshing && <Loading>Refreshing..</Loading>}

          <TaskList
            tasks={tasks}
            setSelectedTask={(t: Todo.Task) => setSelectedTaskId(t.id)}
            addTask={withLoading(
              flow(
                addNewTask,
                T.tap(refetchTasks),
                T.map((r) => setSelectedTaskId(r.id)),
                runPromise
              ),
              datumEither.isPending(newResult) || isRefreshing
            )}
            toggleFavorite={withLoading(
              (t: Todo.Task) => toggleTaskFavorite(t)["|>"](runPromise),
              isUpdatingTask || isRefreshing
            )}
            toggleTaskChecked={withLoading(
              flow(toggleTaskChecked, runPromise),
              isUpdatingTask || isRefreshing
            )}
          />
        </Container>
      </Box>

      <Route
        path={`/${category}/:id`}
        render={({
          match: {
            params: { id },
          },
        }) => {
          const t = tasks.find((x) => x.id === id)
          return (
            t && (
              <Box
                flexBasis="300px"
                style={{ backgroundColor: "#efefef", width: "400px" }}
              >
                <Container>
                  {t && (
                    <TaskDetail
                      task={t}
                      deleteTask={withLoading(
                        () =>
                          pipe(
                            deleteTask(t.id),
                            T.zipRight(refetchTasks()),
                            runPromise
                          ),
                        datumEither.isPending(deleteResult) || isRefreshing
                      )}
                      toggleChecked={withLoading(
                        () => toggleTaskChecked(t)["|>"](runPromise),
                        isUpdatingTask || isRefreshing
                      )}
                      toggleFavorite={withLoading(
                        () => toggleTaskFavorite(t)["|>"](runPromise),
                        isUpdatingTask || isRefreshing
                      )}
                      toggleStepChecked={withLoading(
                        flow(toggleTaskStepChecked(t), runPromise),
                        isUpdatingTask || isRefreshing
                      )}
                      setTitle={withLoading(
                        flow(setTitle(t), runPromise),
                        isUpdatingTask || isRefreshing
                      )}
                      setDue={withLoading(
                        flow(setDue(t), runPromise),
                        isUpdatingTask || isRefreshing
                      )}
                      setReminder={withLoading(
                        flow(setReminder(t), runPromise),
                        isUpdatingTask || isRefreshing
                      )}
                      editNote={withLoading(
                        flow(editNote(t), runPromise),
                        isUpdatingTask || isRefreshing
                      )}
                      addNewStep={withLoading(
                        flow(addNewTaskStep(t), T.asUnit, runPromise),
                        isUpdatingTask || isRefreshing
                      )}
                      updateStepTitle={withLoading(
                        (s: Todo.Step) =>
                          flow(updateStepTitle(t)(s), T.asUnit, runPromise),
                        isUpdatingTask || isRefreshing
                      )}
                      deleteStep={withLoading(
                        flow(deleteTaskStep(t), runPromise),
                        isUpdatingTask || isRefreshing
                      )}
                    />
                  )}
                </Container>
              </Box>
            )
          )
        }}
      ></Route>
    </Box>
  )
}

function TasksScreen() {
  const [tasksResult] = useTasks()
  // testing for multi-call relying on same network-call/cache.
  useTasks()
  useTasks()
  useTasks()

  const {
    params: { category },
  } = useRouteMatch<{ category: "tasks" | "favorites" }>()

  return tasksResult["|>"](
    datumEither.fold(
      () => <div>Hi there... about to get us some Tasks</div>,
      () => <div>Getting us some tasks now..</div>,
      (err) => <>{"Error Refreshing tasks: " + JSON.stringify(err)}</>,
      (tasks) => (
        <Tasks
          tasks={A.filter_(tasks, (x) => category !== "favorites" || x.isFavorite)}
        />
      ),
      (err) => <>{"Error Loading tasks: " + JSON.stringify(err)}</>,
      (tasks) => (
        <Tasks
          tasks={A.filter_(tasks, (x) => category !== "favorites" || x.isFavorite)}
        />
      )
    )
  )
}

export default TasksScreen
