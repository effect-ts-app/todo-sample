import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Box, Card, Checkbox } from "@material-ui/core"
import Alarm from "@material-ui/icons/Alarm"
import CalendarToday from "@material-ui/icons/CalendarToday"
import { datumEither } from "@nll/datum"
import React, { memo, useEffect, useState } from "react"
import styled from "styled-components"

import { useServiceContext } from "../context"
import { PromiseExit } from "../data"

import * as Todo from "./Todo"
import {
  Completable,
  FavoriteButton,
  StateMixinProps,
  StateMixin,
  ClickableMixin,
  Field,
} from "./components"
import { withLoading, WithLoading } from "./utils"

import { useFuncs } from "."

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

const StyledCard = styled(Card)`
  ${ClickableMixin}
`

const CardList = styled.div`
  > ${StyledCard} {
    padding: 4px;
    margin-top: 8px;
    margin-bottom: 8px;
  }
`

function TaskList({
  addTask,
  setSelectedTask,
  tasks,
}: {
  setSelectedTask: (i: Todo.Task) => void
  addTask: WithLoading<(taskTitle: string) => PromiseExit>
  tasks: A.Array<Todo.Task>
}) {
  const [completedTasks, setCompletedTasks] = useState([] as A.Array<Todo.Task>)
  const [openTasks, setOpenTasks] = useState([] as A.Array<Todo.Task>)
  useEffect(() => {
    setCompletedTasks(tasks["|>"](A.filter((x) => O.isSome(x.completed))))
    setOpenTasks(tasks["|>"](A.filter((x) => !O.isSome(x.completed))))
  }, [tasks])

  function Task_({ task: t }: { task: Todo.Task }) {
    const {
      findResult,
      toggleTaskChecked,
      toggleTaskFavorite,
      updateResult,
    } = useFuncs(t.id)
    const isRefreshingTask = datumEither.isRefresh(findResult)
    const isUpdatingTask = datumEither.isPending(updateResult) || isRefreshingTask

    const { runPromise } = useServiceContext()

    const toggleFavorite = withLoading(
      (t: Todo.Task) => toggleTaskFavorite(t)["|>"](runPromise),
      isUpdatingTask
    )

    const toggleChecked = withLoading(
      flow(toggleTaskChecked, runPromise),
      isUpdatingTask
    )
    return (
      <StyledCard onClick={() => setSelectedTask(t)}>
        <Box display="flex">
          <Box flexGrow={1} display="flex">
            <Checkbox
              checked={O.isSome(t.completed)}
              disabled={toggleChecked.loading}
              onClick={(evt) => evt.stopPropagation()}
              onChange={(evt) => {
                evt.stopPropagation()
                toggleChecked(t)
              }}
            />
            <div>
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
            </div>
          </Box>
          <Box>
            <FavoriteButton
              disabled={toggleFavorite.loading}
              onClick={(evt) => {
                evt.stopPropagation()
                toggleFavorite(t)
              }}
              isFavorite={t.isFavorite}
            />
          </Box>
        </Box>
      </StyledCard>
    )
  }
  const Task = memo(Task_)

  return (
    <>
      <CardList>
        {openTasks.map((t) => (
          <Task task={t} key={t.id} />
        ))}
      </CardList>

      {Boolean(completedTasks.length) && (
        <div>
          <h3>Completed</h3>
          <CardList>
            {completedTasks.map((t) => (
              <Task task={t} key={t.id} />
            ))}
          </CardList>
        </div>
      )}

      <div>
        <Field placeholder="Add a Task" disabled={addTask.loading} onChange={addTask} />
      </div>
    </>
  )
}
export default TaskList
