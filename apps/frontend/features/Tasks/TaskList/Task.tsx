import * as A from "@effect-ts-app/core/Array"
import * as O from "@effect-ts/core/Option"
import { Box, Card, Checkbox } from "@material-ui/core"
import Alarm from "@material-ui/icons/Alarm"
import CalendarToday from "@material-ui/icons/CalendarToday"
import Today from "@material-ui/icons/Today"
import { datumEither } from "@nll/datum"
import React from "react"
import { Draggable } from "react-beautiful-dnd"
import styled from "styled-components"

import {
  ClickableMixin,
  Completable,
  FavoriteButton,
  StateMixinProps,
  StateMixin,
} from "@/components"
import { useServiceContext } from "@/context"
import { memo, withLoading } from "@/data"
import { Todo } from "@/index"
import { renderIf_ } from "@/utils"

import { useTaskCommandsResolved } from "../data"

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

export const TaskCard = styled(Card)`
  ${ClickableMixin}
`

const State = styled.span<StateMixinProps>`
  ${StateMixin}
`

export const Task = memo(function ({
  index,
  setSelectedTaskId,
  task: t,
}: {
  task: Todo.Task
  index: number
  setSelectedTaskId: (id: Todo.TaskId) => void
}) {
  const { findResult, toggleTaskChecked, toggleTaskFavorite, updateResult } =
    useTaskCommandsResolved(t)
  const isRefreshingTask = datumEither.isRefresh(findResult)
  const isUpdatingTask = datumEither.isPending(updateResult) || isRefreshingTask

  const { runPromiseExit } = useServiceContext()

  const toggleFavorite = withLoading(
    () => toggleTaskFavorite["|>"](runPromiseExit),
    isUpdatingTask
  )
  const toggleChecked = withLoading(
    () => toggleTaskChecked["|>"](runPromiseExit),
    isUpdatingTask
  )
  return (
    <Draggable draggableId={t.id} index={index}>
      {(provided) => (
        <TaskCard
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => setSelectedTaskId(t.id)}
        >
          <Box display="flex">
            <Box flexGrow={1} display="flex">
              <Checkbox
                checked={O.isSome(t.completed)}
                disabled={toggleChecked.loading}
                onClick={(evt) => evt.stopPropagation()}
                onChange={(evt) => {
                  evt.stopPropagation()
                  toggleChecked()
                }}
              />
              <div>
                <Completable $completed={O.isSome(t.completed)}>{t.title}</Completable>
                <div>
                  {O.isSome(t.myDay) && (
                    <>
                      <Today /> My day -&nbsp;
                    </>
                  )}
                  {makeStepCount(t.steps)}
                  &nbsp;
                  {renderIf_(t.due, (d) => (
                    // eslint-disable-next-line react/jsx-key
                    <State
                      $state={renderIf_(Todo.Task.dueInPast(t), () => "error" as const)}
                    >
                      <CalendarToday />
                      {d.toLocaleDateString()}
                    </State>
                  ))}
                  &nbsp;
                  {O.isSome(t.reminder) && <Alarm />}
                </div>
              </div>
            </Box>
            <Box>
              <FavoriteButton
                disabled={toggleFavorite.loading}
                onClick={(evt) => {
                  evt.stopPropagation()
                  toggleFavorite()
                }}
                isFavorite={t.isFavorite}
              />
            </Box>
          </Box>
        </TaskCard>
      )}
    </Draggable>
  )
})
