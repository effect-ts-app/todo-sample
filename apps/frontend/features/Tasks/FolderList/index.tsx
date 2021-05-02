import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { datumEither } from "@nll/datum"
import React, { useMemo } from "react"

import * as Todo from "@/Todo"
import { toUpperCaseFirst } from "@/utils"

import { emptyTasks, filterByCategory, TaskViews, useMe, useTasks } from "../data"

import { FolderList } from "./FolderList"

import { NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import {
  TaskListEntry,
  TaskListEntryOrGroup,
} from "@effect-ts-demo/todo-client/Temp/GetMe"

const FolderListView = ({ category }: { category: O.Option<NonEmptyString> }) => {
  const [meResult] = useMe()
  const [tasksResult] = useTasks()
  // TODO: the total tasksResults, should be from all loaded folders.
  const unfilteredTasks = datumEither.isSuccess(tasksResult)
    ? tasksResult.value.right
    : emptyTasks

  const [tl, lists] = useMemo(() => {
    const tl = datumEither.isSuccess(meResult)
      ? [meResult.value.right.inbox]
      : ([] as readonly TaskListEntry[])
    const lists = datumEither.isSuccess(meResult)
      ? meResult.value.right.lists
      : ([] as readonly TaskListEntryOrGroup[])
    return [tl, lists] as const
  }, [meResult])

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
        ...tl["|>"](
          A.map(({ id }) =>
            Todo.FolderListADT.of.TaskList({ title: "Tasks", id, tasks: [] })
          )
        ),
        ...lists["|>"](
          A.map(
            TaskListEntryOrGroup.match({
              TaskList: (l) => Todo.FolderListADT.of.TaskList({ ...l, tasks: [] }),
              TaskListGroup: (l) =>
                Todo.FolderListADT.as.TaskListGroup({
                  ...l,
                  lists: l.lists["|>"](
                    A.map((l) => Todo.FolderListADT.as.TaskList({ ...l, tasks: [] }))
                  ),
                }),
            })
          )
        ),
      ] as const,
    [unfilteredTasks, tl, lists]
  )

  return (
    <FolderList
      name={datumEither.isSuccess(meResult) ? meResult.value.right.name : null}
      category={category}
      folders={folders}
    />
  )
}

export default FolderListView
