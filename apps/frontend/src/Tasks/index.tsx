import * as TodoClient from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as T from "@effect-ts/core/Effect"
import { flow, pipe } from "@effect-ts/core/Function"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import React, { useEffect, useState } from "react"
import styled from "styled-components"

import { useFetch } from "../data"
import { useRun } from "../run"

import TaskDetail from "./TaskDetail"
import TaskList from "./TaskList"
import * as Todo from "./Todo"
import { withLoading } from "./utils"

const fetchLatestTasks_ = TodoClient.Tasks.getTasks["|>"](T.map((r) => r.tasks))
const fetchLatestTasks = () => fetchLatestTasks_
function useTasks() {
  const runEffect = useRun()
  const [result, exec] = useFetch(fetchLatestTasks, [] as A.Array<Todo.Task>)

  useEffect(() => {
    exec()["|>"](runEffect)
  }, [exec, runEffect])
  return [result, exec] as const
}

function useNewTask() {
  return useFetch(
    (newTitle: string) => TodoClient.Tasks.createTaskE({ title: newTitle }),
    null
  )
}

const deleteTask = (id: UUID) => TodoClient.Tasks.deleteTask({ id })
function useDeleteTask() {
  return useFetch(deleteTask, null)
}

const updateTask = (t: Todo.Task) => TodoClient.Tasks.updateTask(t)
function useUpdateTask() {
  return useFetch(updateTask, null)
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
  const runEffect = useRun()

  const [tasksResult, getTasks] = useTasks()
  const [newResult, addNewTask] = useNewTask()
  const [deleteResult, deleteTask] = useDeleteTask()
  const [updateResult, updateTask] = useUpdateTask()

  const [selectedTaskId, setSelectedTaskId] = useState<UUID | null>(null)
  const selectedTask = tasksResult.data.find((x) => x.id === selectedTaskId)

  function toggleTaskChecked(t: Todo.Task) {
    return pipe(
      t["|>"](Todo.Task.toggleCompleted)["|>"](updateTask),
      T.zipRight(getTasks())
    )
  }

  function toggleTaskStepChecked(t: Todo.Task) {
    return (s: Todo.Step) =>
      pipe(
        t["|>"](Todo.Task.toggleStepCompleted(s))["|>"](updateTask),
        T.zipRight(getTasks())
      )
  }

  function addNewTaskStep(t: Todo.Task) {
    return flow(
      NonEmptyString.parse,
      T.map((title) => t["|>"](Todo.Task.addStep(title))),
      T.chain(updateTask),
      T.zipRight(getTasks())
    )
  }

  function deleteTaskStep(t: Todo.Task) {
    return (s: Todo.Step) =>
      pipe(t["|>"](Todo.Task.deleteStep(s)), updateTask, T.zipRight(getTasks()))
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
          addTask={withLoading(
            flow(
              addNewTask,
              T.tap(getTasks),
              T.map((r) => setSelectedTaskId(r.id)),
              runEffect
            ),
            newResult.loading || tasksResult.loading
          )}
          setSelectedTask={(t: Todo.Task) => setSelectedTaskId(t.id)}
          deleteTask={withLoading(
            (t: Todo.Task) => pipe(deleteTask(t.id), T.zipRight(getTasks()), runEffect),
            deleteResult.loading
          )}
          toggleTaskChecked={withLoading(
            flow(toggleTaskChecked, runEffect),
            updateResult.loading
          )}
        />
      </div>

      <div>
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            toggleChecked={withLoading(
              () => toggleTaskChecked(selectedTask)["|>"](runEffect),
              tasksResult.loading
            )}
            toggleStepChecked={withLoading(
              flow(toggleTaskStepChecked(selectedTask), runEffect),
              updateResult.loading
            )}
            deleteStep={withLoading(
              flow(deleteTaskStep(selectedTask), runEffect),
              updateResult.loading
            )}
            addNewStep={withLoading(
              flow(addNewTaskStep(selectedTask), T.asUnit, runEffect),
              updateResult.loading
            )}
          />
        )}
      </div>
    </Container>
  )
}

export default Tasks
