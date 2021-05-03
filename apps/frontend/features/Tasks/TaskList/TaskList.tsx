import * as O from "@effect-ts/core/Option"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { Typography } from "@material-ui/core"
import React, { useEffect, useState } from "react"
import { Droppable, DragDropContext } from "react-beautiful-dnd"
import styled from "styled-components"

import * as Todo from "@/Todo"
import { memo } from "@/data"

import { useReorder } from "../data"

import { TaskCard, Task } from "./Task"

import * as A from "@effect-ts-demo/core/ext/Array"

const CardList = styled.div`
  > ${TaskCard} {
    padding: 4px;
    margin-top: 1px;
    margin-bottom: 1px;
  }
`

const TaskList = memo(function ({
  setSelectedTaskId,
  tasks,
}: {
  setSelectedTaskId: (i: UUID) => void
  tasks: A.Array<Todo.Task>
}) {
  const reorder = useReorder()
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
        const destTasks =
          result.destination?.droppableId === "tasks-completed"
            ? completedTasks
            : openTasks
        if (!destTasks[destination.index].id) {
          return
        }
        reorder(t.id, destTasks[destination.index].id)
      }}
    >
      <Droppable droppableId={"tasks"}>
        {(provided) => (
          <CardList ref={provided.innerRef} {...provided.droppableProps}>
            {openTasks.map((t, idx) => (
              <Task
                task={t}
                index={idx}
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
          <Typography variant="h5">Completed</Typography>
          <Droppable droppableId={"tasks-completed"}>
            {(provided) => (
              <CardList ref={provided.innerRef} {...provided.droppableProps}>
                {completedTasks.map((t, idx) => (
                  <Task
                    task={t}
                    index={idx}
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
})
export default TaskList
