import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { datumEither } from "@nll/datum"
import React from "react"

import * as Todo from "@/Todo"
import { toUpperCaseFirst } from "@/utils"

import { emptyTasks, filterByCategory, TaskView, TaskViews, useTasks } from "../data"

import { FolderList } from "./FolderList"

const FolderListView = ({ category }: { category: O.Option<TaskView> }) => {
  const [tasksResult] = useTasks()
  const unfilteredTasks = datumEither.isSuccess(tasksResult)
    ? tasksResult.value.right
    : emptyTasks
  // TODO: count
  // only change when counts change..
  const folders = React.useMemo(
    () =>
      [
        ...TaskViews["|>"](
          A.map((c) => ({
            slug: c as NonEmptyString,
            tasks: unfilteredTasks["|>"](filterByCategory(c)),
          }))
        )["|>"](
          A.map(({ slug, tasks }) =>
            Todo.FolderListADT.of.TaskListView({
              title: toUpperCaseFirst(slug) as NonEmptyString,
              slug,
              count: tasks.length, // should not have separate count if tasks would be provided, but we shouldnt need to provide the tasks in the folderlist anyhow.
              tasks,
            })
          )
        ),
        Todo.FolderListADT.of.TaskList({
          title: "Some list" as NonEmptyString,
          tasks: [],
        }),
        Todo.FolderListADT.of.TaskListGroup({
          title: "Leisure" as NonEmptyString,
          lists: [
            Todo.FolderListADT.as.TaskList({
              title: "Leisure 1" as NonEmptyString,
              tasks: [],
            }),
            Todo.FolderListADT.as.TaskList({
              title: "Leisure 2" as NonEmptyString,
              tasks: [],
            }),
          ],
        }),
        Todo.FolderListADT.of.TaskList({
          title: "Some other list" as NonEmptyString,
          tasks: [],
        }),
      ] as const,
    [unfilteredTasks]
  )

  return <FolderList category={category} folders={folders} />
}

export default FolderListView
