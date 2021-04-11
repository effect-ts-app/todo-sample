import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { constant, flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { Box, Card, Checkbox } from "@material-ui/core"
import Alarm from "@material-ui/icons/Alarm"
import CalendarToday from "@material-ui/icons/CalendarToday"
import Today from "@material-ui/icons/Today"
import { datumEither } from "@nll/datum"
import React, { memo, useEffect, useState } from "react"
import styled from "styled-components"

import { useServiceContext } from "../context"

import * as Todo from "./Todo"
import {
  Completable,
  FavoriteButton,
  StateMixinProps,
  StateMixin,
  ClickableMixin,
} from "./components"
import { useTaskCommands } from "./data"
import { withLoading } from "./utils"

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

function Task_({
  setSelectedTaskId,
  task: t,
}: {
  task: Todo.Task
  setSelectedTaskId: (id: UUID) => void
}) {
  const {
    findResult,
    toggleTaskChecked,
    toggleTaskFavorite,
    updateResult,
  } = useTaskCommands(t.id)
  const isRefreshingTask = datumEither.isRefresh(findResult)
  const isUpdatingTask = datumEither.isPending(updateResult) || isRefreshingTask

  const { runPromise } = useServiceContext()

  const toggleFavorite = withLoading(
    (t: Todo.Task) => toggleTaskFavorite(t)["|>"](runPromise),
    isUpdatingTask
  )

  const toggleChecked = withLoading(flow(toggleTaskChecked, runPromise), isUpdatingTask)
  return (
    <StyledCard onClick={() => setSelectedTaskId(t.id)}>
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
              {O.isSome(t.myDay) && (
                <>
                  <Today /> My day -&nbsp;
                </>
              )}
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

const defaultDate = constant(new Date(1900, 1, 1))

const orders = {
  creation: ORD.contramap_(ORD.date, (t: Todo.Task) => t.createdAt),
  important: ORD.contramap_(ORD.inverted(ORD.boolean), (t: Todo.Task) => t.isFavorite),
  alphabetically: ORD.contramap_(ORD.string, (t: Todo.Task) => t.title.toLowerCase()),
  due: ORD.contramap_(ORD.inverted(ORD.date), (t: Todo.Task) =>
    O.getOrElse_(t.due, defaultDate)
  ),
  myDay: ORD.contramap_(ORD.inverted(ORD.date), (t: Todo.Task) =>
    O.getOrElse_(t.myDay, defaultDate)
  ),
}

type Orders = keyof typeof orders

// TODO: Listbox to choose, and X button to remove order
const order: O.Option<Orders> = O.some("important")

const Task = memo(Task_)
function TaskList_({
  setSelectedTaskId,
  tasks,
}: {
  setSelectedTaskId: (i: UUID) => void
  tasks: A.Array<Todo.Task>
}) {
  const [completedTasks, setCompletedTasks] = useState([] as A.Array<Todo.Task>)
  const [openTasks, setOpenTasks] = useState([] as A.Array<Todo.Task>)
  useEffect(() => {
    const sort = order["|>"](O.map((o) => orders[o]))["|>"](O.map((o) => A.sortBy([o])))
    const orderedTasks = sort["|>"](
      O.fold(
        () => tasks,
        (o) => o(tasks)
      )
    )
    setCompletedTasks(orderedTasks["|>"](A.filter((x) => O.isSome(x.completed))))
    setOpenTasks(orderedTasks["|>"](A.filter((x) => !O.isSome(x.completed))))
  }, [tasks])

  return (
    <>
      <CardList>
        {openTasks.map((t) => (
          <Task task={t} setSelectedTaskId={setSelectedTaskId} key={t.id} />
        ))}
      </CardList>

      {Boolean(completedTasks.length) && (
        <div>
          <h3>Completed</h3>
          <CardList>
            {completedTasks.map((t) => (
              <Task task={t} setSelectedTaskId={setSelectedTaskId} key={t.id} />
            ))}
          </CardList>
        </div>
      )}
    </>
  )
}
const TaskList = memo(TaskList_)
export default TaskList
