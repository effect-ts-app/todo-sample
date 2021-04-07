import { Exit } from "@effect-ts/core/Effect/Exit"
import * as O from "@effect-ts/core/Option"
import React, { createRef, useEffect, useState } from "react"

import * as Todo from "./Todo"
import { Clickable, CompletableEntry, Table } from "./components"
import { WithLoading } from "./utils"

function NoteEditor({
  initialValue,
  onChange,
}: {
  onChange: (note: string) => void
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
      onBlur={() => onChange(note)}
      onChange={(evt) => setNote(evt.target.value)}
    />
  )
}

function TaskDetail({
  addNewStep,
  deleteStep,
  editNote,
  task: t,
  toggleChecked,
  toggleStepChecked,
}: {
  task: Todo.Task
  addNewStep: WithLoading<(stepTitle: string) => Promise<Exit<unknown, unknown>>>
  deleteStep: WithLoading<(s: Todo.Step) => void>
  editNote: WithLoading<(note: string | null) => Promise<Exit<unknown, unknown>>>
  toggleChecked: WithLoading<() => void>
  toggleStepChecked: WithLoading<(s: Todo.Step) => void>
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
              onClick={() =>
                addNewStep(newStepTitle).then(
                  (r) => r._tag === "Success" && setNewStepTitle("")
                )
              }
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

      <div>
        <h3>Note</h3>
        {!noteEdit && (
          <Clickable onClick={() => setNoteEdit(true)}>
            <pre>{O.toNullable(t.note) ?? "Add note"}</pre>
          </Clickable>
        )}
        {noteEdit && (
          <NoteEditor
            initialValue={O.toNullable(t.note) ?? ""}
            onChange={(note) => {
              editNote(note ? note : null).then(
                (x) => x._tag === "Success" && setNoteEdit(false)
              )
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
