import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { datumEither } from "@nll/datum"
import React, { useCallback } from "react"

import { Todo } from "@/index"

import { useTasks } from "../data"
import { useRouting } from "../routing"

import { TaskDetail } from "./TaskDetail"

const TaskDetailView = ({
  category,
  order,
  taskId,
}: {
  taskId: Todo.TaskId
  category: Todo.Category
  order: O.Option<Todo.Ordery>
}) => {
  const [tasksResult] = useTasks()
  const unfilteredTasks = datumEither.isSuccess(tasksResult)
    ? tasksResult.value.right
    : Todo.emptyTasks

  const { setSelectedTaskId } = useRouting(category, order)

  const closeTaskDetail = useCallback(
    () => setSelectedTaskId(null),
    [setSelectedTaskId]
  )

  if (!datumEither.isSuccess(tasksResult)) {
    return <>Loading Task...</>
  }

  const task = unfilteredTasks["|>"](A.findFirst((x) => x.id === taskId))

  return O.fold_(
    task,
    () => <>Task not found</>,
    (t) => <TaskDetail task={t} closeTaskDetail={closeTaskDetail} />
  )
}

export default TaskDetailView
