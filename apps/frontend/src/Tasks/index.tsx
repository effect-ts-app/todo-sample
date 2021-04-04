import * as TodoClient from "@effect-ts-demo/todo-client"
import * as Todo from "@effect-ts-demo/todo-types"
import * as A from "@effect-ts/core/Array"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"
import { Lens } from "@effect-ts/monocle"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import React from "react"
import { useEffect, useState } from "react"
import styled, { css } from "styled-components"

import { useFetch } from "../data"

const fetchLatestTasks_ = TodoClient.Tasks.getTasks["|>"](T.map((r) => r.tasks))
const fetchLatestTasks = () => fetchLatestTasks_
function useTasks() {
  const [result, exec] = useFetch(fetchLatestTasks, [] as A.Array<Todo.Task>)

  useEffect(() => {
    exec()
  }, [exec])
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

function Tasks() {
  const [tasksResult, getTasks] = useTasks()

  const [selectedTaskId, setSelectedTaskId] = useState<UUID | null>(null)
  const selectedTask = tasksResult.data.find((x) => x.id === selectedTaskId)

  const [newResult, setNewTaskTitle, addNewTask] = useNewTask()

  const [deleteResult, deleteTask] = useDeleteTask()

  const [updateResult, updateTask] = useUpdateTask()

  function toggleTaskChecked(t: Todo.Task) {
    const nt = t["|>"](
      Todo.Task.lens["|>"](Lens.prop("completed"))["|>"](Lens.modify((x) => !x))
    )
    return updateTask(nt).then(getTasks)
  }

  function toggleStepChecked(t: Todo.Task, s: Todo.Step) {
    const nt = t["|>"](
      Todo.Task.lens["|>"](Lens.prop("steps"))["|>"](
        Lens.modify((steps) =>
          A.modifyAt_(
            steps,
            A.findIndex_(steps, (x) => x === s)["|>"](O.getOrElse(() => -1)),
            Todo.Step.lens["|>"](Lens.prop("completed"))["|>"](Lens.modify((x) => !x))
          )["|>"](O.getOrElse(() => steps))
        )
      )
    )
    return updateTask(nt).then(getTasks)
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
              onChange={() => toggleTaskChecked(t)}
            />
            {t.title}
            &nbsp; [{makeStepCount(t.steps)}]
            <button
              disabled={deleteResult.loading}
              onClick={() => deleteTask(t.id).then(getTasks)}
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
          onClick={() => addNewTask().then(getTasks)}
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
                      onChange={() => toggleStepChecked(selectedTask, s)}
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
