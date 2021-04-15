import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import { constant, flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Box, Button, Checkbox, IconButton, TextField } from "@material-ui/core"
import ArrowRight from "@material-ui/icons/ArrowRight"
import Delete from "@material-ui/icons/Delete"
import { DatePicker, DateTimePicker } from "@material-ui/lab"
import { datumEither } from "@nll/datum"
import React from "react"
import { Droppable, DragDropContext } from "react-beautiful-dnd"
import styled from "styled-components"

import * as Todo from "@/Todo"
import {
  Completable,
  FavoriteButton,
  Field,
  StateMixin,
  StateMixinProps,
  TextFieldWithEditor,
} from "@/components"
import { useServiceContext } from "@/context"
import { memo, onSuccess, PromiseExit, withLoading, WithLoading } from "@/data"

import { useDeleteTask, useTaskCommands } from "../data"

import { Step } from "./Step"

const StateTextField = styled(TextField)<StateMixinProps>`
  input {
    ${StateMixin}
  }
`

const constEmptyString = constant("")

function TaskDetail_({
  addNewStep,
  closeTaskDetail,
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
  closeTaskDetail: () => void
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
  return (
    <DragDropContext
      onDragEnd={(result) => {
        const { destination } = result
        if (!destination) {
          return
        }
        const stepIndex = parseInt(result.draggableId)
        const step = t.steps[stepIndex]
        updateStepIndex(step)(destination.index)
      }}
    >
      <Box flexGrow={1} display="flex" flexDirection="column">
        <Box display="flex" alignItems="center">
          <Box display="flex" flexGrow={1} alignItems="center">
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
          <hr />
        </div>
        <Box flexGrow={1} overflow="auto">
          <div>
            <Droppable droppableId={"steps"}>
              {(provided) => (
                <Box ref={provided.innerRef} {...provided.droppableProps}>
                  {t.steps.map((s, idx) => (
                    <Step
                      key={idx}
                      index={idx}
                      step={s}
                      deleteStep={withLoading(() => deleteStep(s), deleteStep.loading)}
                      updateTitle={withLoading(
                        updateStepTitle(s),
                        updateStepTitle.loading
                      )}
                      toggleChecked={withLoading(
                        () => toggleStepChecked(s),
                        toggleStepChecked.loading
                      )}
                    />
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
            <div>
              <Field
                size="small"
                fullWidth
                state={t}
                disabled={addNewStep.loading}
                onChange={addNewStep}
                placeholder="Next Step"
              />
            </div>
            <div>
              <hr />
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

        <Box display="flex" alignItems="center" fontSize="12px">
          <Box>
            <IconButton onClick={closeTaskDetail}>
              <ArrowRight />
            </IconButton>
          </Box>
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
            <IconButton
              size="small"
              disabled={deleteTask.loading}
              onClick={() => deleteTask()}
            >
              <Delete />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </DragDropContext>
  )
}

export const TaskDetail = memo(function ({
  closeTaskDetail,
  task: t,
}: {
  task: Todo.Task
  closeTaskDetail: () => void
}) {
  const { runPromise } = useServiceContext()
  const [deleteResult, deleteTask] = useDeleteTask()
  const {
    addNewTaskStep,
    deleteTaskStep,
    editNote,
    findResult,
    modifyTasks,
    setDue,
    setReminder,
    setTitle,
    toggleTaskChecked,
    toggleTaskFavorite,
    toggleTaskMyDay,
    toggleTaskStepChecked,
    updateResult,
    updateStepIndex,
    updateStepTitle,
  } = useTaskCommands(t.id)

  const isRefreshingTask = datumEither.isRefresh(findResult)
  const isUpdatingTask = datumEither.isPending(updateResult) || isRefreshingTask

  return (
    <TaskDetail_
      task={t}
      closeTaskDetail={closeTaskDetail}
      deleteTask={withLoading(
        () =>
          pipe(
            deleteTask(t.id),
            T.map(() =>
              modifyTasks((tasks) =>
                A.unsafeDeleteAt_(
                  tasks,
                  tasks.findIndex((x) => x.id === t.id)
                )
              )
            ),
            runPromise
          ),
        datumEither.isPending(deleteResult)
      )}
      toggleMyDay={withLoading(
        () => toggleTaskMyDay(t)["|>"](runPromise),
        isUpdatingTask
      )}
      toggleChecked={withLoading(
        () => toggleTaskChecked(t)["|>"](runPromise),
        isUpdatingTask
      )}
      toggleFavorite={withLoading(
        () => toggleTaskFavorite(t)["|>"](runPromise),
        isUpdatingTask
      )}
      toggleStepChecked={withLoading(
        flow(toggleTaskStepChecked(t), runPromise),
        isUpdatingTask
      )}
      setTitle={withLoading(flow(setTitle(t), runPromise), isUpdatingTask)}
      setDue={withLoading(flow(setDue(t), runPromise), isUpdatingTask)}
      setReminder={withLoading(flow(setReminder(t), runPromise), isUpdatingTask)}
      editNote={withLoading(flow(editNote(t), runPromise), isUpdatingTask)}
      addNewStep={withLoading(
        flow(addNewTaskStep(t), T.asUnit, runPromise),
        isUpdatingTask
      )}
      updateStepTitle={withLoading(
        (s: Todo.Step) => flow(updateStepTitle(t)(s), T.asUnit, runPromise),
        isUpdatingTask
      )}
      updateStepIndex={withLoading(
        (s: Todo.Step) => flow(updateStepIndex(t)(s), T.asUnit, runPromise),
        isUpdatingTask
      )}
      deleteStep={withLoading(flow(deleteTaskStep(t), runPromise), isUpdatingTask)}
    />
  )
})
