import * as A from "@effect-ts-demo/todo-types/ext/Array"
import * as O from "@effect-ts/core/Option"
import { Exit } from "@effect-ts/system/Exit"
import { Button, IconButton, Checkbox, TextField } from "@material-ui/core"
import { Delete, Alarm } from "@material-ui/icons"
import React, { useState } from "react"

import { onSuccess } from "../data"

import * as Todo from "./Todo"
import { Table, Completable, Clickable } from "./components"
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
            <Clickable as="tr" key={t.id} onClick={() => setSelectedTask(t)}>
              <td>
                <Checkbox
                  checked={O.isSome(t.completed)}
                  disabled={toggleTaskChecked.loading}
                  onChange={() => toggleTaskChecked(t)}
                />
              </td>
              <td>
                <Completable completed={O.isSome(t.completed)}>{t.title}</Completable>
                <div>
                  {makeStepCount(t.steps)}
                  &nbsp;
                  {t.due["|>"](O.map((d) => d.toLocaleDateString()))["|>"](
                    O.toNullable
                  )}
                  &nbsp;
                  {O.toNullable(t.reminder) && <Alarm />}
                </div>
              </td>
              <td>
                <IconButton disabled={deleteTask.loading} onClick={() => deleteTask(t)}>
                  <Delete />
                </IconButton>
              </td>
            </Clickable>
          ))}
        </tbody>
      </Table>
    )
  }
  return (
    <>
      <div>
        <form>
          <TextField
            value={newTaskTitle}
            onChange={(evt) => setNewTaskTitle(evt.target.value)}
          />
          <Button
            type="submit"
            onClick={() =>
              addTask(newTaskTitle).then(onSuccess(() => setNewTaskTitle("")))
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
