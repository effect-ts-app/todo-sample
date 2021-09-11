import * as A from "@effect-ts-app/core/Array"
import * as O from "@effect-ts/core/Option"
import { Typography } from "@mui/material"
import React, { useEffect, useState } from "react"
import { Droppable, DragDropContext } from "react-beautiful-dnd"
import styled from "styled-components"

import { memo } from "@/data"
import { Todo } from "@/index"

import { TaskCard, Task } from "./Task"

const CardList = styled.div`
  > ${TaskCard} {
    padding: 4px;
    margin-top: 1px;
    margin-bottom: 1px;
  }
`

const TaskList = memo(function ({
  reorder,
  setSelectedTaskId,
  tasks,
}: {
  setSelectedTaskId: (i: Todo.TaskId) => void
  tasks: A.Array<Todo.Task>
  reorder: (tid: Todo.TaskId, did: Todo.TaskId) => void
}) {
  //const reorder = useReorder()

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
        const task = tasks.find((x) => x.id === result.draggableId)!
        const destTasks =
          result.destination?.droppableId === "tasks-completed"
            ? completedTasks
            : openTasks
        if (!destTasks[destination.index].id) {
          return
        }
        reorder(task.id, destTasks[destination.index].id)
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
