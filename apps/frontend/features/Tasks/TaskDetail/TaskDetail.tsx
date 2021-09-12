import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import { flow, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import ArrowRight from "@mui/icons-material/ArrowRight"
import Remove from "@mui/icons-material/Remove"
import { DatePicker, DateTimePicker } from "@mui/lab"
import { Box, Button, Checkbox, IconButton, TextField, Typography } from "@mui/material"
import { datumEither } from "@nll/datum"
import React from "react"
import { Droppable, DragDropContext } from "react-beautiful-dnd"
import styled from "styled-components"

import {
  Completable,
  FavoriteButton,
  Field,
  StateMixin,
  StateMixinProps,
  TextFieldWithEditor,
} from "@/components"
import { useServiceContext } from "@/context"
import { memo, onSuccess, withLoading } from "@/data"
import { Todo } from "@/index"
import { constEmptyString, renderIf_ } from "@/utils"

import { useRemoveTask, useTaskCommandsResolved } from "../data"

import { Step } from "./Step"

const StateTextField = styled(TextField)<StateMixinProps>`
  input {
    ${StateMixin}
  }
`

export const TaskDetail = memo(function ({
  closeTaskDetail,
  task: t,
}: {
  task: Todo.Task
  closeTaskDetail: () => void
}) {
  const f = useFuncs(t)

  return (
    <DragDropContext
      onDragEnd={(result) => {
        const { destination } = result
        if (!destination) {
          return
        }
        const stepIndex = parseInt(result.draggableId)
        const step = t.steps[stepIndex]
        f.updateStepIndex(step)(destination.index)
      }}
    >
      <Box flexGrow={1} display="flex" flexDirection="column">
        <Box display="flex" alignItems="center">
          <Box display="flex" flexGrow={1} alignItems="center">
            <Checkbox
              disabled={f.toggleChecked.loading}
              checked={O.isSome(t.completed)}
              onChange={() => f.toggleChecked()}
            />
            <TextFieldWithEditor
              loading={f.setTitle.loading}
              initialValue={t.title}
              onChange={(title, onSuc) => {
                f.setTitle(title).then(onSuccess(onSuc))
              }}
            >
              <Completable
                as={Typography}
                variant="h5"
                display="inline"
                $completed={O.isSome(t.completed)}
              >
                {t.title}
              </Completable>
            </TextFieldWithEditor>
          </Box>
          <Box>
            <FavoriteButton
              isFavorite={t.isFavorite}
              disabled={f.toggleChecked.loading}
              onClick={f.toggleFavorite}
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
                      removeStep={withLoading(
                        () => f.removeStep(s),
                        f.removeStep.loading
                      )}
                      updateTitle={withLoading(
                        f.updateStepTitle(s),
                        f.updateStepTitle.loading
                      )}
                      toggleChecked={withLoading(
                        () => f.toggleStepChecked(s),
                        f.toggleStepChecked.loading
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
                disabled={f.addNewStep.loading}
                onChange={f.addNewStep}
                placeholder="Next Step"
              />
            </div>
            <div>
              <hr />
            </div>
          </div>

          <div>
            <Button onClick={f.toggleMyDay}>
              {t.myDay["|>"](
                O.fold(
                  () => "Add to my day",
                  () => "Added to my day"
                )
              )}
            </Button>
          </div>

          <div>
            <Typography variant="h5">Reminder</Typography>
            <DateTimePicker
              disabled={f.setReminder.loading}
              renderInput={(p) => (
                <StateTextField
                  $state={renderIf_(Todo.Task.reminderInPast(t), StateMixin.error)}
                  {...p}
                />
              )}
              value={O.toNullable(t.reminder)}
              onChange={(value) => {
                f.setReminder(value)
              }}
            />
          </div>

          <div>
            <Typography variant="h5">Due Date</Typography>
            <DatePicker
              disabled={f.setDue.loading}
              renderInput={(p) => (
                <StateTextField
                  $state={renderIf_(Todo.Task.dueInPast(t), StateMixin.error)}
                  {...p}
                />
              )}
              value={O.toNullable(t.due)}
              onChange={f.setDue}
            />
          </div>

          <Typography variant="h5">Note</Typography>
          <TextFieldWithEditor
            multiline={true}
            loading={f.editNote.loading}
            initialValue={t.note["|>"](O.getOrElse(constEmptyString))}
            onChange={(note, onSuc) => {
              f.editNote(note ? note : null).then(onSuccess(onSuc))
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
              disabled={f.removeTask.loading}
              onClick={() => f.removeTask()}
            >
              <Remove />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </DragDropContext>
  )
})

function useFuncs(t: Todo.Task) {
  const { runPromiseExit } = useServiceContext()
  const [removeResult, removeTask] = useRemoveTask()
  const {
    addNewTaskStep,
    editNote,
    findResult,
    modifyTasks,
    removeTaskStep,
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
  } = useTaskCommandsResolved(t)

  const isRefreshingTask = datumEither.isRefresh(findResult)
  const isUpdatingTask = datumEither.isPending(updateResult) || isRefreshingTask

  return {
    removeTask: withLoading(
      () =>
        pipe(
          removeTask(t.id),
          T.map(() =>
            modifyTasks((tasks) =>
              A.unsafeDeleteAt_(
                tasks,
                tasks.findIndex((x) => x.id === t.id)
              )
            )
          ),
          runPromiseExit
        ),
      datumEither.isPending(removeResult)
    ),
    toggleMyDay: withLoading(
      () => toggleTaskMyDay["|>"](runPromiseExit),
      isUpdatingTask
    ),
    toggleChecked: withLoading(
      () => toggleTaskChecked["|>"](runPromiseExit),
      isUpdatingTask
    ),
    toggleFavorite: withLoading(
      () => toggleTaskFavorite["|>"](runPromiseExit),
      isUpdatingTask
    ),
    toggleStepChecked: withLoading(
      flow(toggleTaskStepChecked, runPromiseExit),
      isUpdatingTask
    ),
    setTitle: withLoading(flow(setTitle, runPromiseExit), isUpdatingTask),
    setDue: withLoading(flow(setDue, runPromiseExit), isUpdatingTask),
    setReminder: withLoading(flow(setReminder, runPromiseExit), isUpdatingTask),
    editNote: withLoading(flow(editNote, runPromiseExit), isUpdatingTask),
    addNewStep: withLoading(
      flow(addNewTaskStep, T.asUnit, runPromiseExit),
      isUpdatingTask
    ),
    updateStepTitle: withLoading(
      (s: Todo.Step) => flow(updateStepTitle(s), T.asUnit, runPromiseExit),
      isUpdatingTask
    ),
    updateStepIndex: withLoading(
      (s: Todo.Step) => flow(updateStepIndex(s), T.asUnit, runPromiseExit),
      isUpdatingTask
    ),
    removeStep: withLoading(flow(removeTaskStep, runPromiseExit), isUpdatingTask),
  }
}
