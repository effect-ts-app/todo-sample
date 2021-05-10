import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { datumEither } from "@nll/datum"
import React from "react"

import { Todo } from "@/index"
import { toUpperCaseFirst } from "@/utils"

import {
  emptyTasks,
  filterByCategory,
  TaskList,
  TaskListGroup,
  TaskListView,
  TaskViews,
  useMe,
  useTasks,
} from "../data"

import { FolderList } from "./FolderList"

import * as S from "@effect-ts-demo/core/ext/Schema"
import { TaskListEntryOrGroup } from "@effect-ts-demo/todo-client/Tasks/GetMe"

const defaultLists = [] as readonly TaskListEntryOrGroup[]

const FolderListView = ({ category }: { category: O.Option<Todo.Category> }) => {
  const [meResult] = useMe()
  const [tasksResult] = useTasks()
  // TODO: the total tasksResults, should be from all loaded folders.
  const unfilteredTasks = datumEither.isSuccess(tasksResult)
    ? tasksResult.value.right
    : emptyTasks

  const lists = datumEither.isSuccess(meResult)
    ? meResult.value.right.lists
    : defaultLists

  const folders = React.useMemo(
    () =>
      [
        ...TaskViews["|>"](
          A.map((c) => ({
            slug: c,
            tasks: unfilteredTasks["|>"](filterByCategory(c)),
          }))
        )["|>"](
          A.map(
            ({ slug, tasks }) =>
              new TaskListView({
                title: toUpperCaseFirst(slug) as S.NonEmptyString,
                slug,
                count: tasks.length,
              })
          )
        ),
        new TaskListView({
          title: "Tasks" as S.NonEmptyString,
          slug: "tasks",
          count: unfilteredTasks["|>"](filterByCategory("inbox")).length,
        }),
        ...lists["|>"](
          A.filter((x) => x._tag !== "TaskList" || O.isNone(x.parentListId))
        )["|>"](
          A.map(
            TaskListEntryOrGroup.Api.matchW({
              TaskList: (l) =>
                new TaskList({
                  ...l,
                  count: unfilteredTasks["|>"](filterByCategory(l.id)).length,
                }),
              TaskListGroup: (g) =>
                new TaskListGroup({
                  ...g,
                  lists: g.lists["|>"](
                    A.filterMap((lid) =>
                      lists["|>"](
                        A.findFirstMap((l) =>
                          l._tag === "TaskList" && l.id === lid ? O.some(l) : O.none
                        )
                      )
                    )
                  )["|>"](
                    A.map(
                      (l) =>
                        new TaskList({
                          ...l,
                          count: unfilteredTasks["|>"](filterByCategory(l.id)).length,
                        })
                    )
                  ),
                }),
            })
          )
        ),
      ] as const,
    [unfilteredTasks, lists]
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
