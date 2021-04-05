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
  const [result, addNewTask] = useFetch(
    () =>
      TodoClient.Tasks.createTaskE({ title: newTaskTitle })["|>"](
        T.tap(() => T.effectTotal(() => setNewTaskTitle("")))
      ),
    null
  )

  return [{ ...result, newTaskTitle }, setNewTaskTitle, addNewTask] as const
}

const deleteTask = (id: UUID) => TodoClient.Tasks.deleteTask({ id })
function useDeleteTask() {
  return useFetch(deleteTask, null)
}

const updateTask = (t: Todo.Task) => TodoClient.Tasks.updateTask(t)
function useUpdateTask() {
  return useFetch(updateTask, null)
}

const CompletableEntry = styled.tr<{ completed: boolean }>`
  ${({ onClick }) =>
    onClick &&
    css`
      cursor: pointer;
    `}
  ${({ completed }) =>
    completed &&
    css`
      text-decoration: line-through;
    `}
`

function makeStepCount(steps: Todo.Task["steps"]) {
  if (steps.length === 0) {
    return <>0</>
  }
  const completedSteps = steps["|>"](A.filter((x) => x.completed))
  return (
    <>
      {completedSteps.length} of {steps.length}
    </>
  )
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
  toggleChecked,
  toggleStepChecked,
}: {
  task: Todo.Task
  addNewStep: WithLoading<(stepTitle: string) => Promise<void>>
  deleteStep: WithLoading<(s: Todo.Step) => void>
  toggleChecked: WithLoading<() => void>
  toggleStepChecked: WithLoading<(s: Todo.Step) => void>
}) {
  const [newStepTitle, setNewStepTitle] = useState("")
  return (
    <>
      <CompletableEntry as="h2" completed={t.completed} style={{ textAlign: "left" }}>
        <input
          type="checkbox"
          disabled={toggleChecked.loading}
          checked={t.completed}
          onChange={() => toggleChecked()}
        />
        &nbsp;
        {t.title}
      </CompletableEntry>
      <div>
        <div>
          <form>
            <input
              value={newStepTitle}
              onChange={(evt) => setNewStepTitle(evt.target.value)}
              type="text"
            />
            <button
              onClick={() => addNewStep(newStepTitle).then(() => setNewStepTitle(""))}
              disabled={!newStepTitle.length || addNewStep.loading}
            >
              add step
            </button>
          </form>
        </div>
        <Table>
          <tbody>
            {t.steps.map((s, idx) => (
              <CompletableEntry completed={s.completed} key={idx}>
                <td>
                  <input
                    type="checkbox"
                    disabled={toggleStepChecked.loading}
                    checked={s.completed}
                    onChange={() => toggleStepChecked(s)}
                  />
                </td>
                <td>{s.title}</td>
                <td>
                  <button disabled={deleteStep.loading} onClick={() => deleteStep(s)}>
                    X
                  </button>
                </td>
              </CompletableEntry>
            ))}
          </tbody>
        </Table>
      </div>

      <hr />
      <div>
        <i>Updated: {t.updatedAt.toISOString()}</i>
      </div>
      <div>
        <i>Created: {t.createdAt.toISOString()}</i>
      </div>
      <div>
        <i>Id: {t.id}</i>
      </div>
    </>
  )
}

const Table = styled.table`
  width: 100%;
  tr > td {
    text-align: left;
  }
`

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
    <Table>
      <tbody>
        {tasks.map((t) => (
          <CompletableEntry
            key={t.id}
            completed={t.completed}
            onClick={() => setSelectedTask(t)}
          >
            <td>
              <input
                type="checkbox"
                checked={t.completed}
                disabled={toggleTaskChecked.loading}
                onChange={() => toggleTaskChecked(t)}
              />
            </td>
            <td>
              {t.title}
              <br />
              {makeStepCount(t.steps)}
            </td>
            <td>
              <button disabled={deleteTask.loading} onClick={() => deleteTask(t)}>
                X
              </button>
            </td>
          </CompletableEntry>
        ))}
      </tbody>
    </Table>
  )
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
    <Container>
      <div>
        <div>
          <h1>Tasks</h1>
        </div>
        {tasksResult.loading && <Loading>Loading Tasks...</Loading>}
        {tasksResult.error && "Error Loading tasks: " + tasksResult.error}
        <div>
          <form>
            <input
              value={newResult.newTaskTitle}
              onChange={(evt) => setNewTaskTitle(evt.target.value)}
              type="text"
            />
            <button
              onClick={flow(
                addNewTask,
                T.tap(getTasks),
                T.map((r) => setSelectedTaskId(r.id)),
                runEffect
              )}
              disabled={!newResult.newTaskTitle.length || newResult.loading}
            >
              create task
            </button>
          </form>
        </div>

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
      </div>

      <div>
        {selectedTask && (
          <Task
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
