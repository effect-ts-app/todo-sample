import * as TodoClient from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as T from "@effect-ts/core/Effect"
import { constant, flow, pipe } from "@effect-ts/core/Function"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import React, { useEffect, useState } from "react"
import styled from "styled-components"

import { useServiceContext } from "../context"
import { useFetch, useQuery } from "../data"

import TaskDetail from "./TaskDetail"
import TaskList from "./TaskList"
import * as Todo from "./Todo"
import { withLoading } from "./utils"

const fetchLatestTasks = constant(
  TodoClient.Tasks.getTasks["|>"](T.map((r) => r.tasks))
)

function useTasks() {
  const { runWithErrorLog } = useServiceContext()
  const [result, refetch, exec] = useQuery(
    "latestTasks",
    fetchLatestTasks,
    [] as A.Array<Todo.Task>
  )

  useEffect(() => {
    const cancel = exec()["|>"](runWithErrorLog)
    return () => {
      cancel()
    }
  }, [exec, runWithErrorLog])
  return [result, refetch] as const
}

const newTask = (newTitle: string) => TodoClient.Tasks.createTaskE({ title: newTitle })
function useNewTask() {
  return useFetch(newTask, null)
}

const deleteTask = (id: UUID) => TodoClient.Tasks.deleteTask({ id })
function useDeleteTask() {
  return useFetch(deleteTask, null)
}

function useUpdateTask() {
  return useFetch(TodoClient.Tasks.updateTask, null)
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

function Tasks() {
  const { runPromise } = useServiceContext()

  const [tasksResult, getTasks] = useTasks()
  useTasks()
  useTasks()
  useTasks()
  const [newResult, addNewTask] = useNewTask()
  const [deleteResult, deleteTask] = useDeleteTask()
  const [updateResult, updateTask] = useUpdateTask()

  const [selectedTaskId, setSelectedTaskId] = useState<UUID | null>(null)
  const selectedTask = tasksResult.data.find((x) => x.id === selectedTaskId)

  function toggleTaskChecked(t: Todo.Task) {
    return pipe(
      T.effectTotal(() => t["|>"](Todo.Task.toggleCompleted)),
      T.chain(updateTask),
      T.zipRight(getTasks())
    )
  }

  function toggleTaskStepChecked(t: Todo.Task) {
    return (s: Todo.Step) =>
      pipe(
        T.effectTotal(() => t["|>"](Todo.Task.toggleStepCompleted(s))),
        T.chain(updateTask),
        T.zipRight(getTasks())
      )
  }

  function addNewTaskStep(t: Todo.Task) {
    return flow(
      NonEmptyString.parse,
      T.map((title) => t["|>"](Todo.Task.addStep(title))),
      T.chain(updateTask),
      T.zipRight(getTasks()["|>"](T.forkDaemon))
    )
  }

  function deleteTaskStep(t: Todo.Task) {
    return (s: Todo.Step) =>
      pipe(
        T.effectTotal(() => t["|>"](Todo.Task.deleteStep(s))),
        T.chain(updateTask),
        T.zipRight(getTasks())
      )
  }

  return (
    <Container>
      <div>
        <div>
          <h1>Tasks</h1>
        </div>
        {tasksResult.loading && <Loading>Loading Tasks...</Loading>}
        {tasksResult.error && "Error Loading tasks: " + tasksResult.error}

        <TaskList
          tasks={tasksResult.data}
          setSelectedTask={(t: Todo.Task) => setSelectedTaskId(t.id)}
          addTask={withLoading(
            flow(
              addNewTask,
              T.tap(getTasks),
              T.map((r) => setSelectedTaskId(r.id)),
              runPromise
            ),
            newResult.loading || tasksResult.loading
          )}
          deleteTask={withLoading(
            (t: Todo.Task) =>
              pipe(deleteTask(t.id), T.zipRight(getTasks()), runPromise),
            deleteResult.loading || tasksResult.loading
          )}
          toggleTaskChecked={withLoading(
            flow(toggleTaskChecked, runPromise),
            updateResult.loading || tasksResult.loading
          )}
        />
      </div>

      <div>
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            toggleChecked={withLoading(
              () => toggleTaskChecked(selectedTask)["|>"](runPromise),
              updateResult.loading || tasksResult.loading
            )}
            toggleStepChecked={withLoading(
              flow(toggleTaskStepChecked(selectedTask), runPromise),
              updateResult.loading || tasksResult.loading
            )}
            addNewStep={withLoading(
              flow(addNewTaskStep(selectedTask), T.asUnit, runPromise),
              updateResult.loading || tasksResult.loading
            )}
            deleteStep={withLoading(
              flow(deleteTaskStep(selectedTask), runPromise),
              updateResult.loading || tasksResult.loading
            )}
          />
        )}
      </div>
    </Container>
  )
}

export default Tasks
