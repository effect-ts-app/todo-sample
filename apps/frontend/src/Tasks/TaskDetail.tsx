import { Exit } from "@effect-ts/core/Effect/Exit"
import * as O from "@effect-ts/core/Option"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import DatePicker from "@material-ui/lab/DatePicker"
import DateTimePicker from "@material-ui/lab/DateTimePicker"
import React, { createRef, useEffect, useState } from "react"
import styled from "styled-components"

import { onSuccess } from "../data"

import * as Todo from "./Todo"
import { Clickable, CompletableEntry, Table } from "./components"
import { WithLoading } from "./utils"

function NoteEditor({
  initialValue,
  loading,
  onChange,
}: {
  onChange: (note: string) => void
  loading: boolean
  initialValue: string
}) {
  const editor = createRef<HTMLTextAreaElement>()
  useEffect(() => {
    editor?.current?.focus()
  }, [])
  const [note, setNote] = useState(initialValue)

  return (
    <textarea
      ref={editor}
      value={note}
      disabled={loading}
      onBlur={() => onChange(note)}
      onChange={(evt) => setNote(evt.target.value)}
    />
  )
}

// TODO: override doesnt work, need to add SC support for MUI
const StateTextField = styled(TextField)<{ state?: "error" | "warn" | null }>`
  color: ${(props) =>
    props.state === "warn" ? "yellow" : props.state === "error" ? "red" : "inherit"};
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
}: {
  task: Todo.Task
  setDue: WithLoading<(d: Date | null) => Promise<Exit<unknown, unknown>>>
  setReminder: WithLoading<(d: Date | null) => Promise<Exit<unknown, unknown>>>
  addNewStep: WithLoading<(stepTitle: string) => Promise<Exit<unknown, unknown>>>
  deleteStep: WithLoading<(s: Todo.Step) => void>
  editNote: WithLoading<(note: string | null) => Promise<Exit<unknown, unknown>>>
  toggleChecked: WithLoading<() => void>
  toggleStepChecked: WithLoading<(s: Todo.Step) => void>
  toggleFavorite: WithLoading<() => void>
}) {
  const [newStepTitle, setNewStepTitle] = useState("")
  const [noteEdit, setNoteEdit] = useState(false)

  useEffect(() => {
    setNewStepTitle("")
    setNoteEdit(false)
  }, [t])

  return (
    <>
      <CompletableEntry
        as="h2"
        completed={O.isSome(t.completed)}
        style={{ textAlign: "left" }}
      >
        <input
          type="checkbox"
          disabled={toggleChecked.loading}
          checked={O.isSome(t.completed)}
          onChange={() => toggleChecked()}
        />
        &nbsp;
        {t.title}
        &nbsp;
        <input
          type="checkbox"
          disabled={toggleChecked.loading}
          checked={t.isFavorite}
          onChange={() => toggleFavorite()}
        />
      </CompletableEntry>
      <div>
        <div>
          <form>
            <input
              value={newStepTitle}
              disabled={addNewStep.loading}
              onChange={(evt) => setNewStepTitle(evt.target.value)}
              type="text"
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
                  <Button disabled={deleteStep.loading} onClick={() => deleteStep(s)}>
                    X
                  </Button>
                </td>
              </CompletableEntry>
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
                  state={t.reminder["|>"](
                    O.chain((d) => (d < new Date() ? O.some("error" as const) : O.none))
                  )["|>"](O.toNullable)}
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
                  state={t.due["|>"](
                    O.chain((d) => (d < new Date() ? O.some("error" as const) : O.none))
                  )["|>"](O.toNullable)}
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
        {!noteEdit && (
          <Clickable onClick={() => setNoteEdit(true)}>
            <pre>{O.toNullable(t.note) ?? "Add note"}</pre>
          </Clickable>
        )}
        {noteEdit && (
          <NoteEditor
            loading={editNote.loading}
            initialValue={O.toNullable(t.note) ?? ""}
            onChange={(note) => {
              editNote(note ? note : null).then(onSuccess(() => setNoteEdit(false)))
            }}
          />
        )}
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
