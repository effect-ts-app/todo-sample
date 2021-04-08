import * as O from "@effect-ts/core/Option"
import { Button, Checkbox, IconButton, TextField } from "@material-ui/core"
import { Delete, Favorite, FavoriteBorder } from "@material-ui/icons"
import { DatePicker, DateTimePicker } from "@material-ui/lab"
import React, { useEffect, useState } from "react"
import styled from "styled-components"

import { onSuccess, PromiseExit } from "../data"

import * as Todo from "./Todo"
import { Completable, Table, TextFieldWithEditor } from "./components"
import { WithLoading } from "./utils"

const StateTextField = styled(TextField)<{ state?: "error" | "warn" | null }>`
  input {
    color: ${(props) =>
      props.state === "warn" ? "yellow" : props.state === "error" ? "red" : "inherit"};
  }
`

function TaskDetail({
  addNewStep,
  deleteStep,
  editNote,
  setDue,
  setReminder,
  task: t,
  toggleChecked,
  toggleFavorite,
  toggleStepChecked,
  updateStepTitle,
}: {
  task: Todo.Task
  setDue: WithLoading<(d: Date | null) => PromiseExit>
  setReminder: WithLoading<(d: Date | null) => PromiseExit>
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

        <TextFieldWithEditor
          loading={updateStepTitle.loading}
          initialValue={s.title}
          onChange={(title, onSuc) => {
            updateStepTitle(s)(title).then(onSuccess(onSuc))
          }}
        >
          <Completable as="td" completed={s.completed}>
            {s.title}
          </Completable>
        </TextFieldWithEditor>
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
      <Completable
        as="h2"
        completed={O.isSome(t.completed)}
        style={{ textAlign: "left" }}
      >
        <Checkbox
          disabled={toggleChecked.loading}
          checked={O.isSome(t.completed)}
          onChange={() => toggleChecked()}
        />
        &nbsp;
        {t.title}
        &nbsp;
        <IconButton disabled={toggleChecked.loading} onClick={() => toggleFavorite()}>
          {t.isFavorite ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
      </Completable>
      <div>
        <div>
          <form>
            <TextField
              value={newStepTitle}
              onChange={(evt) => setNewStepTitle(evt.target.value)}
            />
            <Button
              type="submit"
              onClick={() =>
                addNewStep(newStepTitle).then(onSuccess(() => setNewStepTitle("")))
              }
              disabled={!newStepTitle.length || addNewStep.loading}
            >
              add step
            </Button>
          </form>
        </div>
        <Table>
          <tbody>
            {t.steps.map((s, idx) => (
              <Step key={idx} step={s} />
            ))}
          </tbody>
        </Table>
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
      {O.isSome(t.completed) ? (
        <div>Completed: {t.completed.value.toLocaleDateString()}</div>
      ) : (
        <div>Created: {t.createdAt.toLocaleDateString()} at </div>
      )}
      <div>
        <i>
          Updated: {t.updatedAt.toLocaleDateString()} at{" "}
          {t.updatedAt.toLocaleTimeString()}
        </i>
      </div>
      <div>
        <i>Id: {t.id}</i>
      </div>
    </>
  )
}

export default TaskDetail
