import * as A from "@effect-ts-demo/todo-types/ext/Array"
import * as O from "@effect-ts/core/Option"
import { Exit } from "@effect-ts/system/Exit"
import { Checkbox, TextField } from "@material-ui/core"
import { Alarm, CalendarToday } from "@material-ui/icons"
import React, { useState } from "react"
import styled from "styled-components"

import { onSuccess } from "../data"

import * as Todo from "./Todo"
import {
  Table,
  Completable,
  Clickable,
  FavoriteButton,
  StateMixinProps,
  StateMixin,
} from "./components"
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

const State = styled.span<StateMixinProps>`
  ${StateMixin}
`

function TaskList({
  addTask,
  setSelectedTask,
  tasks,
  toggleFavorite,
  toggleTaskChecked,
}: {
  setSelectedTask: (i: Todo.Task) => void
  toggleTaskChecked: WithLoading<(t: Todo.Task) => void>
  addTask: WithLoading<(taskTitle: string) => Promise<Exit<unknown, unknown>>>
  toggleFavorite: WithLoading<(t: Todo.Task) => void>
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
                  {t.due["|>"](
                    O.map((d) => (
                      // eslint-disable-next-line react/jsx-key
                      <State
                        state={t["|>"](Todo.Task.dueInPast)
                          ["|>"](O.map(() => "error" as const))
                          ["|>"](O.toNullable)}
                      >
                        <CalendarToday />
                        {d.toLocaleDateString()}
                      </State>
                    ))
                  )["|>"](O.toNullable)}
                  &nbsp;
                  {O.toNullable(t.reminder) && <Alarm />}
                </div>
              </td>
              <td>
                <FavoriteButton
                  disabled={toggleFavorite.loading}
                  toggleFavorite={() => toggleFavorite(t)}
                  isFavorite={t.isFavorite}
                />
              </td>
            </Clickable>
          ))}
        </tbody>
      </Table>
    )
  }
  return (
    <>
      {makeTasksTable(tasks["|>"](A.filter((x) => !O.isSome(x.completed))))}

      {Boolean(completedTasks.length) && (
        <div>
          <h3>Completed</h3>
          {makeTasksTable(completedTasks)}
        </div>
      )}

      <div>
        <TextField
          placeholder="Add a Task"
          disabled={addTask.loading}
          value={newTaskTitle}
          onKeyPress={(evt) =>
            evt.charCode === 13 &&
            newTaskTitle.length &&
            addTask(newTaskTitle).then(onSuccess(() => setNewTaskTitle("")))
          }
          onChange={(evt) => setNewTaskTitle(evt.target.value)}
        />
      </div>
    </>
  )
}
export default TaskList
