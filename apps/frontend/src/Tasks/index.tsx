import * as TodoClient from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as T from "@effect-ts/core/Effect"
import { flow, pipe } from "@effect-ts/core/Function"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import React, { useEffect, useState } from "react"
import styled, { css } from "styled-components"

import { useFetch } from "../data"
import { useRun } from "../run"

import * as Todo from "./Todo"

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
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [{ loading }, addNewTask] = useFetch(
    () =>
      TodoClient.Tasks.createTaskE({ title: newTaskTitle })["|>"](
        T.map(() => setNewTaskTitle(""))
      ),
    null
  )

  return [{ newTaskTitle, loading }, setNewTaskTitle, addNewTask] as const
}

const deleteTask = (id: UUID) => TodoClient.Tasks.deleteTask({ id })
function useDeleteTask() {
  return useFetch(deleteTask, null)
}

const updateTask = (t: Todo.Task) => TodoClient.Tasks.updateTask(t)
function useUpdateTask() {
  return useFetch(updateTask, null)
}

const CompletableEntry = styled.li<{ completed: boolean }>`
  ${({ completed }) =>
    completed &&
    css`
      text-decoration: line-through;
    `}
`

function makeStepCount(steps: Todo.Task["steps"]) {
  if (steps.length === 0) {
    return "0"
  }
  const completedSteps = steps["|>"](A.filter((x) => x.completed))
  return `${completedSteps.length}/${steps.length}`
}

type WithLoading<Fnc> = Fnc & {
  loading: boolean
}

function withLoading<Fnc>(fnc: Fnc, loading: boolean): WithLoading<Fnc> {
  return Object.assign(fnc, { loading })
}

function Task({
  addNewStep,
  deleteStep,
  task: t,
  toggleStepChecked,
}: {
  task: Todo.Task
  addNewStep: WithLoading<(stepTitle: string) => void>
  deleteStep: WithLoading<(s: Todo.Step) => void>
  toggleStepChecked: WithLoading<(s: Todo.Step) => void>
}) {
  const [newStepTitle, setNewStepTitle] = useState("")
  return (
    <>
      {t.title}
      <div>
        <h2>Steps</h2>
        <ul>
          {t.steps.map((s, idx) => (
            <CompletableEntry completed={s.completed} key={idx}>
              <input
                type="checkbox"
                disabled={toggleStepChecked.loading}
                checked={s.completed}
                onChange={() => toggleStepChecked(s)}
              />
              {s.title}
              <button disabled={deleteStep.loading} onClick={() => deleteStep(s)}>
                X
              </button>
            </CompletableEntry>
          ))}
        </ul>
        <div>
          <input
            value={newStepTitle}
            onChange={(evt) => setNewStepTitle(evt.target.value)}
            type="text"
          />
          <button
            onClick={() => addNewStep(newStepTitle)}
            disabled={!newStepTitle.length || addNewStep.loading}
          >
            add step
          </button>
        </div>
      </div>
      <div>Updated: {t.updatedAt.toISOString()}</div>
      <div>Created: {t.createdAt.toISOString()}</div>
      <div>
        <i>Id: {t.id}</i>
      </div>
    </>
  )
}

function TaskList({
  deleteTask,
  setSelectedTask,
  tasks,
  toggleTaskChecked,
}: {
  setSelectedTask: (i: Todo.Task) => void
  toggleTaskChecked: WithLoading<(t: Todo.Task) => void>
  deleteTask: WithLoading<(t: Todo.Task) => void>
  tasks: A.Array<Todo.Task>
}) {
  return (
    <ul>
      {tasks.map((t) => (
        <CompletableEntry
          key={t.id}
          completed={t.completed}
          onClick={() => setSelectedTask(t)}
        >
          <input
            type="checkbox"
            checked={t.completed}
            disabled={toggleTaskChecked.loading}
            onChange={() => toggleTaskChecked(t)}
          />
          {t.title}
          &nbsp; [{makeStepCount(t.steps)}]
          <button disabled={deleteTask.loading} onClick={() => deleteTask(t)}>
            X
          </button>
        </CompletableEntry>
      ))}
    </ul>
  )
}

function Tasks() {
  const runEffect = useRun()

  const [tasksResult, getTasks] = useTasks()
  const [newResult, setNewTaskTitle, addNewTask] = useNewTask()
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
    <div>
      <div>
        <h1>Tasks</h1>
      </div>
      {tasksResult.loading && "Loading Tasks..."}
      {tasksResult.error && "Error Loading tasks: " + tasksResult.error}
      <TaskList
        tasks={tasksResult.data}
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
      <div>
        <input
          value={newResult.newTaskTitle}
          onChange={(evt) => setNewTaskTitle(evt.target.value)}
          type="text"
        />
        <button
          onClick={flow(addNewTask, T.zipRight(getTasks()), runEffect)}
          disabled={!newResult.newTaskTitle.length || newResult.loading}
        >
          create task
        </button>
      </div>

      <div>
        <h2>Selected Task</h2>
        {selectedTask && (
          <Task
            task={selectedTask}
            toggleStepChecked={withLoading(
              flow(toggleTaskStepChecked(selectedTask), runEffect),
              updateResult.loading
            )}
            deleteStep={withLoading(
              flow(deleteTaskStep(selectedTask), runEffect),
              updateResult.loading
            )}
            addNewStep={withLoading(
              flow(addNewTaskStep(selectedTask), runEffect),
              updateResult.loading
            )}
          />
        )}
        {!selectedTask && "Please select a task"}
      </div>
    </div>
  )
}

export default Tasks
