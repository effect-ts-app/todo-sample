import * as TodoClient from "@effect-ts-demo/todo-client"
import * as Todo from "@effect-ts-demo/todo-types"
import * as A from "@effect-ts-demo/todo-types/ext/Array"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import { Lens } from "@effect-ts/monocle"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import React, { useEffect, useState } from "react"
import styled, { css } from "styled-components"

import { useFetch } from "../data"
import { useRun } from "../run"

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

const Task = styled.li<Pick<Todo.Task, "completed">>`
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

const taskSteps = Todo.Task.lens["|>"](Lens.prop("steps"))
const stepCompleted = Todo.Step.lens["|>"](Lens.prop("completed"))

const TodoStep = Object.assign(Todo.Step, {
  toggleCompleted: stepCompleted["|>"](Lens.modify((x) => !x)),
})

const TodoTask = Object.assign(Todo.Task, {
  toggleCompleted: Todo.Task.lens["|>"](Lens.prop("completed"))["|>"](
    Lens.modify((x) => !x)
  ),
  toggleStepCompleted: (s: Todo.Step) =>
    taskSteps["|>"](Lens.modify(A.modifyOrOriginal(s, TodoStep.toggleCompleted))),
})

function Tasks() {
  const runEffect = useRun()

  const [tasksResult, getTasks] = useTasks()
  const [newResult, setNewTaskTitle, addNewTask] = useNewTask()
  const [deleteResult, deleteTask] = useDeleteTask()
  const [updateResult, updateTask] = useUpdateTask()

  const [selectedTaskId, setSelectedTaskId] = useState<UUID | null>(null)
  const selectedTask = tasksResult.data.find((x) => x.id === selectedTaskId)

  function toggleTaskChecked(t: Todo.Task) {
    return pipe(TodoTask.toggleCompleted(t), updateTask, T.zipRight(getTasks()))
  }

  function toggleStepChecked(t: Todo.Task, s: Todo.Step) {
    return pipe(
      t["|>"](TodoTask.toggleStepCompleted(s)),
      updateTask,
      T.zipRight(getTasks())
    )
  }

  return (
    <div>
      <div>
        <h1>Tasks</h1>
      </div>
      {tasksResult.loading && "Loading Tasks..."}
      {tasksResult.error && "Error Loading tasks: " + tasksResult.error}
      <ul>
        {tasksResult.data.map((t) => (
          <Task
            key={t.id}
            completed={t.completed}
            onClick={() => setSelectedTaskId(t.id)}
          >
            <input
              type="checkbox"
              checked={t.completed}
              disabled={updateResult.loading}
              onChange={() => toggleTaskChecked(t)["|>"](runEffect)}
            />
            {t.title}
            &nbsp; [{makeStepCount(t.steps)}]
            <button
              disabled={deleteResult.loading}
              onClick={() => pipe(deleteTask(t.id), T.zipRight(getTasks()), runEffect)}
            >
              X
            </button>
          </Task>
        ))}
      </ul>
      <div>
        <input
          value={newResult.newTaskTitle}
          onChange={(evt) => setNewTaskTitle(evt.target.value)}
          type="text"
        />
        <button
          onClick={() => pipe(addNewTask(), T.zipRight(getTasks()), runEffect)}
          disabled={!newResult.newTaskTitle.length || newResult.loading}
        >
          add
        </button>
      </div>

      <div>
        <h2>Selected Task</h2>
        {selectedTask && (
          <>
            {selectedTask.title}
            <div>
              <ul>
                {selectedTask.steps.map((s, idx) => (
                  <li key={idx}>
                    <input
                      type="checkbox"
                      disabled={updateResult.loading}
                      checked={s.completed}
                      onChange={() =>
                        toggleStepChecked(selectedTask, s)["|>"](runEffect)
                      }
                    />
                    {s.title}
                  </li>
                ))}
              </ul>
            </div>
            <div>Updated: {selectedTask.updatedAt.toISOString()}</div>
            <div>Created: {selectedTask.createdAt.toISOString()}</div>
            <div>
              <i>Id: {selectedTask.id}</i>
            </div>
          </>
        )}
        {!selectedTask && "Please select a task"}
      </div>
    </div>
  )
}

export default Tasks
