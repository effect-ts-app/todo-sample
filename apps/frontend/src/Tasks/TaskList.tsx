import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { Exit } from "@effect-ts/system/Exit"
import React, { useState } from "react"

import * as Todo from "./Todo"
import { Table, CompletableEntry } from "./components"
import { WithLoading } from "./utils"

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

function TaskList({
  addTask,
  deleteTask,
  setSelectedTask,
  tasks,
  toggleTaskChecked,
}: {
  setSelectedTask: (i: Todo.Task) => void
  toggleTaskChecked: WithLoading<(t: Todo.Task) => void>
  addTask: WithLoading<(taskTitle: string) => Promise<Exit<unknown, unknown>>>
  deleteTask: WithLoading<(t: Todo.Task) => void>
  tasks: A.Array<Todo.Task>
}) {
  const [newTaskTitle, setNewTaskTitle] = useState("")
  return (
    <>
      <div>
        <form>
          <input
            value={newTaskTitle}
            onChange={(evt) => setNewTaskTitle(evt.target.value)}
            type="text"
          />
          <button
            onClick={() =>
              addTask(newTaskTitle).then(
                (x) => x._tag === "Success" && setNewTaskTitle("")
              )
            }
            disabled={!newTaskTitle.length || addTask.loading}
          >
            create task
          </button>
        </form>
      </div>

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
    </>
  )
}
export default TaskList
