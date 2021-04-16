import * as TodoClient from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts-demo/todo-types/ext/Array"
import * as O from "@effect-ts/core/Option"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { Typography } from "@material-ui/core"
import React, { useEffect, useState } from "react"
import { Droppable, DragDropContext } from "react-beautiful-dnd"
import styled from "styled-components"

import * as Todo from "@/Todo"
import { useServiceContext } from "@/context"
import { memo } from "@/data"

import { useModifyTasks } from "../data"

import { TaskCard, Task } from "./Task"

const CardList = styled.div`
  > ${TaskCard} {
    padding: 4px;
    margin-top: 8px;
    margin-bottom: 8px;
  }
`

const TaskList = memo(function ({
  setSelectedTaskId,
  tasks,
}: {
  setSelectedTaskId: (i: UUID) => void
  tasks: A.Array<Todo.Task>
}) {
  const { runWithErrorLog } = useServiceContext()
  const modifyTasks = useModifyTasks()
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
        // TODO: Next section aint pretty.
        const reorder = Todo.updateTaskIndex(t, destination.index)
        modifyTasks(reorder)
        const reorderedTasks = tasks["|>"](reorder)
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
          <Typography variant="h5">Completed</Typography>
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
})
export default TaskList
