import * as TodoClient from "@effect-ts-demo/todo-client"
import * as T from "@effect-ts-demo/todo-types/ext/Effect"
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as A from "@effect-ts/core/Array"
import { constant, flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { datumEither } from "@nll/datum"
import React, { useEffect, useState } from "react"
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

const newTask = (newTitle: string) => TodoClient.Tasks.createTaskE({ title: newTitle })
function useNewTask() {
  return useFetch(newTask)
}

const deleteTask = (id: UUID) => TodoClient.Tasks.deleteTask({ id })
function useDeleteTask() {
  return useFetch(deleteTask)
}

function useUpdateTask() {
  return useFetch(TodoClient.Tasks.updateTask)
}

const Container = styled.div`
  display: flex;
  flex-flow: row;
  > * {
    width: 100%;
  }
`

const Loading = styled.div`
  position: fixed;
`

function Tasks({ tasks }: { tasks: A.Array<Todo.Task> }) {
  const { runPromise } = useServiceContext()
  const [tasksResult, , refetchTasks] = useTasks()
  const [newResult, addNewTask] = useNewTask()
  const [deleteResult, deleteTask] = useDeleteTask()
  const [updateResult, updateTask] = useUpdateTask()

  const [selectedTaskId, setSelectedTaskId] = useState<UUID | null>(null)

  function toggleTaskChecked(t: Todo.Task) {
    return pipe(
      T.effectTotal(() => t["|>"](Todo.Task.toggleCompleted)),
      T.chain(updateTask),
      T.zipRight(refetchTasks())
    )
  }

  function toggleTaskFavorite(t: Todo.Task) {
    return pipe(
      T.effectTotal(() => t["|>"](Todo.Task.toggleFavorite)),
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

  const selectedTask = tasks.find((x) => x.id === selectedTaskId)
  const isRefreshing = datumEither.isRefresh(tasksResult)
  const isUpdatingTask = datumEither.isPending(updateResult)

  return (
    <Container>
      <div>
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
          deleteTask={withLoading(
            (t: Todo.Task) =>
              pipe(deleteTask(t.id), T.zipRight(refetchTasks()), runPromise),
            datumEither.isPending(deleteResult) || isRefreshing
          )}
          toggleTaskChecked={withLoading(
            flow(toggleTaskChecked, runPromise),
            isUpdatingTask || isRefreshing
          )}
        />
      </div>

      <div>
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            toggleChecked={withLoading(
              () => toggleTaskChecked(selectedTask)["|>"](runPromise),
              isUpdatingTask || isRefreshing
            )}
            toggleFavorite={withLoading(
              () => toggleTaskFavorite(selectedTask)["|>"](runPromise),
              isUpdatingTask || isRefreshing
            )}
            toggleStepChecked={withLoading(
              flow(toggleTaskStepChecked(selectedTask), runPromise),
              isUpdatingTask || isRefreshing
            )}
            editNote={withLoading(
              flow(editNote(selectedTask), runPromise),
              isUpdatingTask || isRefreshing
            )}
            addNewStep={withLoading(
              flow(addNewTaskStep(selectedTask), T.asUnit, runPromise),
              isUpdatingTask || isRefreshing
            )}
            deleteStep={withLoading(
              flow(deleteTaskStep(selectedTask), runPromise),
              isUpdatingTask || isRefreshing
            )}
          />
        )}
      </div>
    </Container>
  )
}

function TasksScreen() {
  const [tasksResult] = useTasks()
  // testing for multi-call relying on same network-call/cache.
  useTasks()
  useTasks()
  useTasks()

  return tasksResult["|>"](
    datumEither.fold(
      () => <div>Hi there... about to get us some Tasks</div>,
      () => <div>Getting us some tasks now..</div>,
      (err) => <>{"Error Refreshing tasks: " + JSON.stringify(err)}</>,
      (tasks) => <Tasks tasks={tasks} />,
      (err) => <>{"Error Loading tasks: " + JSON.stringify(err)}</>,
      (tasks) => <Tasks tasks={tasks} />
    )
  )
}

export default TasksScreen
