import { constant } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Box, Button, Checkbox, IconButton, TextField } from "@material-ui/core"
import Delete from "@material-ui/icons/Delete"
import { DatePicker, DateTimePicker } from "@material-ui/lab"
import React, { memo, useEffect, useState } from "react"
import { Draggable, Droppable, DragDropContext } from "react-beautiful-dnd"
import styled from "styled-components"

import { onSuccess, PromiseExit } from "../data"

import * as Todo from "./Todo"
import {
  Completable,
  FavoriteButton,
  Field,
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

function TaskDetail_({
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
  toggleMyDay,
  toggleStepChecked,
  updateStepIndex,
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
  updateStepIndex: WithLoading<(s: Todo.Step) => (newIndex: number) => PromiseExit>
  editNote: WithLoading<(note: string | null) => PromiseExit>
  toggleChecked: WithLoading<() => void>
  toggleMyDay: WithLoading<() => void>
  toggleStepChecked: WithLoading<(s: Todo.Step) => void>
  toggleFavorite: WithLoading<() => void>
}) {
  function Step({ index, step: s }: { step: Todo.Step; index: number }) {
    return (
      <Draggable draggableId={index.toString()} index={index}>
        {(provided) => (
          <Box
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            display="flex"
          >
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
        )}
      </Draggable>
    )
  }

  const [steps, setSteps] = useState(t.steps)
  useEffect(() => {
    setSteps(t.steps)
  }, [t.steps])

  return (
    <DragDropContext
      onDragEnd={(result) => {
        const { destination } = result
        if (!destination) {
          return
        }
        const stepIndex = parseInt(result.draggableId)
        const step = steps[stepIndex]
        setSteps(Todo.updateStepIndex(step, destination.index))
        updateStepIndex(step)(destination.index)
      }}
    >
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
          <Droppable droppableId={"steps"}>
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps}>
                {steps.map((s, idx) => (
                  <Step key={idx} index={idx} step={s} />
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
          <div>
            <Field
              state={t}
              disabled={addNewStep.loading}
              onChange={addNewStep}
              placeholder="Next Step"
            />
          </div>
        </div>

        <div>
          <Button onClick={toggleMyDay}>
            {t.myDay["|>"](
              O.fold(
                () => "Add to my day",
                () => "Added to my day"
              )
            )}
          </Button>
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
    </DragDropContext>
  )
}

const TaskDetail = memo(TaskDetail_)
export default TaskDetail
