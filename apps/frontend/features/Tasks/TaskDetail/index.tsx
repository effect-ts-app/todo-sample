import { UUID } from "@effect-ts-demo/todo-types/shared"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { datumEither } from "@nll/datum"
import React, { useCallback } from "react"

import { emptyTasks, Ordery, TaskView, useTasks } from "../data"
import { useRouting } from "../routing"

import { TaskDetail } from "./TaskDetail"

const TaskDetailView = ({
  category,
  order,
  taskId,
}: {
  taskId: UUID
  category: O.Option<TaskView>
  order: O.Option<Ordery>
}) => {
  const [tasksResult] = useTasks()
  const unfilteredTasks = datumEither.isSuccess(tasksResult)
    ? tasksResult.value.right
    : emptyTasks

  const { setSelectedTaskId } = useRouting(
    O.getOrElse_(category, () => "tasks"),
    order
  )

  const closeTaskDetail = useCallback(() => setSelectedTaskId(null), [
    setSelectedTaskId,
  ])

  const t = unfilteredTasks["|>"](A.findFirst((x) => x.id === taskId))

  return O.fold_(
    t,
    () => <>Task not found</>,
    (t) => <TaskDetail task={t} closeTaskDetail={closeTaskDetail} />
  )
}

export default TaskDetailView
