import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { datumEither } from "@nll/datum"
import React from "react"
import { DragDropContext } from "react-beautiful-dnd"

import { useServiceContext } from "@/context"
import { Todo, TodoClient } from "@/index"
import { toUpperCaseFirst } from "@/utils"

import {
  emptyTasks,
  filterByCategory,
  TaskList,
  TaskListGroup,
  TaskListView,
  TaskViews,
  useMe,
  useModifyMe,
  useTasks,
} from "../data"

import { FolderList } from "./FolderList"

import * as S from "@effect-ts-demo/core/ext/Schema"
import {
  TaskListEntry,
  TaskListEntryOrGroup,
} from "@effect-ts-demo/todo-client/Tasks/GetMe"

const defaultLists = [] as readonly TaskListEntryOrGroup[]

const FolderListView = ({ category }: { category: O.Option<Todo.Category> }) => {
  const [meResult] = useMe()
  const modifyMe = useModifyMe()

  const { runWithErrorLog } = useServiceContext()

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
          A.filter((x) => !TaskListEntry.Guard(x) || O.isNone(x.parentListId))
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
    <DragDropContext
      onDragEnd={(result) => {
        const { destination } = result
        if (!destination) {
          return
        }
        const group = lists["|>"](
          A.findFirstMap((x) =>
            x._tag === "TaskListGroup" && x.id === destination.droppableId
              ? O.some(x)
              : O.none
          )
        )["|>"](O.toNullable)
        const list = lists["|>"](
          A.findFirstMap((x) =>
            x._tag === "TaskList" && x.id === result.draggableId ? O.some(x) : O.none
          )
        )["|>"](O.toNullable)

        if (!group || !list) {
          return
        }

        runWithErrorLog(
          TodoClient.TasksClient.UpdateTaskListGroup({
            id: group.id,
            lists: group.lists["|>"](A.filter((l) => l !== list.id))
              ["|>"](A.insertAt(destination.index, list.id))
              ["|>"](O.getOrElse(() => group.lists)),
          })
        )

        modifyMe((m) => ({
          ...m,
          lists: m.lists["|>"](
            A.map((x) =>
              x._tag === "TaskListGroup" && x.id === group.id
                ? {
                    ...x,
                    lists: x.lists["|>"](A.filter((l) => l !== list.id))
                      ["|>"](A.insertAt(destination.index, list.id))
                      ["|>"](O.getOrElse(() => x.lists)),
                  }
                : x
            )
          ),
        }))
      }}
    >
      <FolderList
        name={datumEither.isSuccess(meResult) ? meResult.value.right.name : null}
        category={category}
        folders={folders}
      />
    </DragDropContext>
  )
}

export default FolderListView
