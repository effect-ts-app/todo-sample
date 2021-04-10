import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import { constant } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Box, Checkbox, IconButton, TextField, TextFieldProps } from "@material-ui/core"
import Delete from "@material-ui/icons/Delete"
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
  TextFieldWithEditor,
} from "./components"
import { WithLoading } from "./utils"

const StateTextField = styled(TextField)<StateMixinProps>`
  input {
    ${StateMixin}
  }
`

const constEmptyString = constant("")

const Field = ({
  onChange,
  state,
  ...rest
}: {
  onChange: (t: NonEmptyString) => PromiseExit
  state: any
} & Omit<TextFieldProps, "onChange">) => {
  const [text, setText] = useState("")
  const clearText = () => setText("")
  useEffect(() => {
    clearText()
  }, [state])

  return (
    <TextField
      value={text}
      onChange={(evt) => setText(evt.target.value)}
      onKeyPress={(evt) => {
        evt.charCode === 13 &&
          text.length &&
          onChange(text as NonEmptyString).then(onSuccess(clearText))
      }}
      {...rest}
    />
  )
}

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
  function Step({ step: s }: { step: Todo.Step }) {
    return (
      <Box display="flex">
        <Box flexGrow={1}>
          <Checkbox
            disabled={toggleStepChecked.loading}
            checked={s.completed}
            onChange={() => toggleStepChecked(s)}
          />
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
        </Box>
        <Box>
          <IconButton disabled={deleteStep.loading} onClick={() => deleteStep(s)}>
            <Delete />
          </IconButton>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexGrow={1} display="flex" flexDirection="column">
      <Box display="flex">
        <Box display="flex" flexGrow={1}>
          <Checkbox
            disabled={toggleChecked.loading}
            checked={O.isSome(t.completed)}
            onChange={() => toggleChecked()}
          />
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
        </Box>
        <Box>
          <FavoriteButton
            isFavorite={t.isFavorite}
            disabled={toggleChecked.loading}
            onClick={toggleFavorite}
          />
        </Box>
      </Box>
      <div>
        <Box>
          {t.steps.map((s, idx) => (
            <Step key={idx} step={s} />
          ))}
        </Box>
        <div>
          <Field
            state={t}
            disabled={addNewStep.loading}
            onChange={addNewStep}
            placeholder="Next Step"
          />
        </div>
      </div>

      <Box flexGrow={1}>
        <div>
          <h3>Reminder</h3>
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
        </div>

        <div>
          <h3>Due Date</h3>
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
        </div>

        <h3>Note</h3>
        <TextFieldWithEditor
          multiline={true}
          loading={editNote.loading}
          initialValue={t.note["|>"](O.getOrElse(constEmptyString))}
          onChange={(note, onSuc) => {
            editNote(note ? note : null).then(onSuccess(onSuc))
          }}
        >
          <pre>{t.note["|>"](O.getOrElse(() => "Add note"))}</pre>
        </TextFieldWithEditor>
        <hr />
      </Box>

      <Box display="flex">
        <Box flexGrow={1} textAlign="center">
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
        </Box>
        <Box>
          <IconButton disabled={deleteTask.loading} onClick={() => deleteTask()}>
            <Delete />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default TaskDetail
