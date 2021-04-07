import * as A from "@effect-ts-demo/todo-types/ext/Array"
import * as O from "@effect-ts/core/Option"
import { Exit } from "@effect-ts/system/Exit"
import Button from "@material-ui/core/Button"
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
  const completedTasks = tasks["|>"](A.filter((x) => O.isSome(x.completed)))

  function makeTasksTable(tasks: A.Array<Todo.Task>) {
    return (
      <Table>
        <tbody>
          {tasks.map((t) => (
            <CompletableEntry
              key={t.id}
              completed={O.isSome(t.completed)}
              onClick={() => setSelectedTask(t)}
            >
              <td>
                <input
                  type="checkbox"
                  checked={O.isSome(t.completed)}
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
                <Button disabled={deleteTask.loading} onClick={() => deleteTask(t)}>
                  X
                </Button>
              </td>
            </CompletableEntry>
          ))}
        </tbody>
      </Table>
    )
  }
  return (
    <>
      <div>
        <form>
          <input
            value={newTaskTitle}
            onChange={(evt) => setNewTaskTitle(evt.target.value)}
            type="text"
          />
          <Button
            onClick={() =>
              addTask(newTaskTitle).then(
                (x) => x._tag === "Success" && setNewTaskTitle("")
              )
            }
            disabled={!newTaskTitle.length || addTask.loading}
          >
            create task
          </Button>
        </form>
      </div>

      {makeTasksTable(tasks["|>"](A.filter((x) => !O.isSome(x.completed))))}

      {Boolean(completedTasks.length) && (
        <div>
          <h3>Completed</h3>
          {makeTasksTable(completedTasks)}
        </div>
      )}
    </>
  )
}
export default TaskList
