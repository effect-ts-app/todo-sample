import * as O from "@effect-ts/core/Option"
import { Checkbox, IconButton, TextField } from "@material-ui/core"
import { Delete } from "@material-ui/icons"
import { DatePicker, DateTimePicker } from "@material-ui/lab"
import React, { useEffect, useState } from "react"
import styled from "styled-components"

import { onSuccess, PromiseExit } from "../data"

import * as Todo from "./Todo"
import {
  Completable,
  FavoriteButton,
  StateMixin,
  StateMixinProps,
  Table,
  TextFieldWithEditor,
} from "./components"
import { WithLoading } from "./utils"

const StateTextField = styled(TextField)<StateMixinProps>`
  input {
    ${StateMixin}
  }
`

function TaskDetail({
  addNewStep,
  deleteStep,
  deleteTask,
  editNote,
  setDue,
  setReminder,
  setTitle,
  task: t,
  toggleChecked,
  toggleFavorite,
  toggleStepChecked,
  updateStepTitle,
}: {
  task: Todo.Task
  deleteTask: WithLoading<() => void>
  setDue: WithLoading<(d: Date | null) => PromiseExit>
  setReminder: WithLoading<(d: Date | null) => PromiseExit>
  setTitle: WithLoading<(d: string) => PromiseExit>
  addNewStep: WithLoading<(stepTitle: string) => PromiseExit>
  deleteStep: WithLoading<(s: Todo.Step) => void>
  updateStepTitle: WithLoading<(s: Todo.Step) => (newTitle: string) => PromiseExit>
  editNote: WithLoading<(note: string | null) => PromiseExit>
  toggleChecked: WithLoading<() => void>
  toggleStepChecked: WithLoading<(s: Todo.Step) => void>
  toggleFavorite: WithLoading<() => void>
}) {
  const [newStepTitle, setNewStepTitle] = useState("")

  useEffect(() => {
    setNewStepTitle("")
  }, [t])

  function Step({ step: s }: { step: Todo.Step }) {
    return (
      <tr>
        <td>
          <Checkbox
            disabled={toggleStepChecked.loading}
            checked={s.completed}
            onChange={() => toggleStepChecked(s)}
          />
        </td>
        <td>
          <TextFieldWithEditor
            loading={updateStepTitle.loading}
            initialValue={s.title}
            onChange={(title, onSuc) => {
              updateStepTitle(s)(title).then(onSuccess(onSuc))
            }}
          >
            <Completable as="span" completed={s.completed}>
              {s.title}
            </Completable>
          </TextFieldWithEditor>
        </td>
        <td>
          <IconButton disabled={deleteStep.loading} onClick={() => deleteStep(s)}>
            <Delete />
          </IconButton>
        </td>
      </tr>
    )
  }

  return (
    <>
      <div>
        <Checkbox
          disabled={toggleChecked.loading}
          checked={O.isSome(t.completed)}
          onChange={() => toggleChecked()}
        />
        &nbsp;
        <TextFieldWithEditor
          loading={setTitle.loading}
          initialValue={t.title}
          onChange={(title, onSuc) => {
            setTitle(title).then(onSuccess(onSuc))
          }}
        >
          <Completable
            as="h2"
            style={{ display: "inline" }}
            completed={O.isSome(t.completed)}
          >
            {t.title}
          </Completable>
        </TextFieldWithEditor>
        &nbsp;
        <FavoriteButton
          isFavorite={t.isFavorite}
          disabled={toggleChecked.loading}
          toggleFavorite={toggleFavorite}
        />
      </div>
      <div>
        <Table>
          <tbody>
            {t.steps.map((s, idx) => (
              <Step key={idx} step={s} />
            ))}
          </tbody>
        </Table>
        <div>
          <TextField
            value={newStepTitle}
            onChange={(evt) => setNewStepTitle(evt.target.value)}
            disabled={addNewStep.loading}
            onKeyPress={(evt) => {
              evt.charCode === 13 &&
                newStepTitle.length &&
                addNewStep(newStepTitle).then(onSuccess(() => setNewStepTitle("")))
            }}
            placeholder="Next Step"
          />
        </div>
      </div>

      <div>
        <div>
          <h3>Reminder</h3>
          {
            <DateTimePicker
              disabled={setReminder.loading}
              renderInput={(p) => (
                <StateTextField
                  state={t["|>"](Todo.Task.reminderInPast)
                    ["|>"](O.map(() => "error" as const))
                    ["|>"](O.toNullable)}
                  {...p}
                />
              )}
              value={O.toNullable(t.reminder)}
              onChange={(value) => {
                setReminder(value)
              }}
            />
          }
        </div>

        <div>
          <h3>Due Date</h3>
          {
            <DatePicker
              disabled={setDue.loading}
              renderInput={(p) => (
                <StateTextField
                  state={t["|>"](Todo.Task.dueInPast)
                    ["|>"](O.map(() => "error" as const))
                    ["|>"](O.toNullable)}
                  {...p}
                />
              )}
              value={O.toNullable(t.due)}
              onChange={(value) => {
                setDue(value)
              }}
            />
          }
        </div>

        <h3>Note</h3>
        <TextFieldWithEditor
          multiline={true}
          loading={editNote.loading}
          initialValue={O.toNullable(t.note) ?? ""}
          onChange={(note, onSuc) => {
            editNote(note ? note : null).then(onSuccess(onSuc))
          }}
        >
          <pre>{O.toNullable(t.note) ?? "Add note"}</pre>
        </TextFieldWithEditor>
      </div>

      <hr />
      <div>
        <span
          title={`Updated: ${t.updatedAt.toLocaleDateString()} at
          ${t.updatedAt.toLocaleTimeString()}`}
        >
          {t.completed["|>"](
            O.fold(
              () => <>Created: {t.createdAt.toLocaleDateString()}</>,
              (d) => <>Completed: {d.toLocaleDateString()}</>
            )
          )}
        </span>
        <IconButton disabled={deleteTask.loading} onClick={() => deleteTask()}>
          <Delete />
        </IconButton>
      </div>
    </>
  )
}

export default TaskDetail
