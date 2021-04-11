import * as TodoClient from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts-demo/todo-types/ext/Array"
import { flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { Box, Card, Checkbox } from "@material-ui/core"
import Alarm from "@material-ui/icons/Alarm"
import CalendarToday from "@material-ui/icons/CalendarToday"
import Today from "@material-ui/icons/Today"
import { datumEither } from "@nll/datum"
import React, { useEffect, useState } from "react"
import { Draggable, Droppable, DragDropContext } from "react-beautiful-dnd"
import styled from "styled-components"

import { useServiceContext } from "../context"
import { memo } from "../data"

import * as Todo from "./Todo"
import { updateTaskIndex } from "./Todo"
import {
  Completable,
  FavoriteButton,
  StateMixinProps,
  StateMixin,
  ClickableMixin,
} from "./components"
import { useModifyTasks, useTaskCommands } from "./data"
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
  index,
  setSelectedTaskId,
  task: t,
}: {
  task: Todo.Task
  index: number
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
    <Draggable draggableId={t.id} index={index}>
      {(provided) => (
        <StyledCard
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
      )}
    </Draggable>
  )
}

const Task = memo(Task_)
function TaskList_({
  setSelectedTaskId,
  tasks: tasksOriginal,
}: {
  setSelectedTaskId: (i: UUID) => void
  tasks: A.Array<Todo.Task>
}) {
  const { runWithErrorLog } = useServiceContext()
  const modifyTasks = useModifyTasks()
  const [tasks, setTasks] = useState(tasksOriginal)
  useEffect(() => {
    setTasks(tasksOriginal)
  }, [tasksOriginal])
  const [{ completedTasks, openTasks }, setFilteredTasks] = useState(() => ({
    completedTasks: [] as A.Array<Todo.Task>,
    openTasks: [] as A.Array<Todo.Task>,
  }))
  useEffect(() => {
    setFilteredTasks({
      openTasks: tasks["|>"](A.filter((x) => !O.isSome(x.completed))),
      completedTasks: tasks["|>"](A.filter((x) => O.isSome(x.completed))),
    })
  }, [tasks])

  return (
    <DragDropContext
      onDragEnd={(result) => {
        const { destination } = result
        if (!destination) {
          return
        }
        const t = tasks.find((x) => x.id === result.draggableId)!
        const reorder = updateTaskIndex(t, destination.index)
        modifyTasks(reorder)
        const reorderedTasks = tasks["|>"](reorder)
        setTasks(reorderedTasks)
        TodoClient.Tasks.setTasksOrder({
          order: A.map_(reorderedTasks, (t) => t.id),
        })["|>"](runWithErrorLog)
      }}
    >
      <Droppable droppableId={"tasks"}>
        {(provided) => (
          <CardList ref={provided.innerRef} {...provided.droppableProps}>
            {openTasks.map((t) => (
              <Task
                task={t}
                index={tasks.findIndex((ot) => ot === t)}
                setSelectedTaskId={setSelectedTaskId}
                key={t.id}
              />
            ))}
            {provided.placeholder}
          </CardList>
        )}
      </Droppable>

      {Boolean(completedTasks.length) && (
        <div>
          <h3>Completed</h3>
          <Droppable droppableId={"tasks-completed"}>
            {(provided) => (
              <CardList ref={provided.innerRef} {...provided.droppableProps}>
                {completedTasks.map((t) => (
                  <Task
                    task={t}
                    index={tasks.findIndex((ot) => ot === t)}
                    setSelectedTaskId={setSelectedTaskId}
                    key={t.id}
                  />
                ))}
                {provided.placeholder}
              </CardList>
            )}
          </Droppable>
        </div>
      )}
    </DragDropContext>
  )
}
const TaskList = memo(TaskList_)
export default TaskList
