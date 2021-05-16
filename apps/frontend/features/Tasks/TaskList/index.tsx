import * as A from "@effect-ts-demo/core/ext/Array"
import * as T from "@effect-ts-demo/core/ext/Effect"
import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import * as NA from "@effect-ts/core/Collections/Immutable/NonEmptyArray"
import { flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { Ord } from "@effect-ts/core/Ord"
import { Box, Button, IconButton, Typography } from "@material-ui/core"
import ArrowDown from "@material-ui/icons/ArrowDownward"
import ArrowUp from "@material-ui/icons/ArrowUpward"
import Refresh from "@material-ui/icons/Refresh"
import { datumEither } from "@nll/datum"
import React from "react"
import useInterval from "use-interval"

import { Field } from "@/components"
import { useServiceContext } from "@/context"
import { memo, withLoading } from "@/data"
import { TodoClient } from "@/index"
import { Todo } from "@/index"
import { renderIf_, toUpperCaseFirst } from "@/utils"

import {
  parseRSunsafe,
  useGetTask,
  useMe,
  useModifyMe,
  useNewTask,
  useTasks,
} from "../data"
import { useRouting } from "../routing"

import TaskList from "./TaskList"
import { TaskListMenu } from "./TaskListMenu"

const TaskListView = memo(function ({
  category,
  order,
}: {
  category: Todo.Category
  order: O.Option<Todo.Ordery>
}) {
  const [meResult] = useMe()
  const modifyMe = useModifyMe()
  const { runWithErrorLog } = useServiceContext()

  const [tasksResult1, , refetchTasks] = useTasks()
  const isDynamicCategory = Todo.TaskViews.includes(category as any)
  const tasksResult = tasksResult1
  useInterval(() => refetchTasks, 30 * 1000)
  // testing for multi-call relying on same network-call/cache.
  //   useTasks()
  //   useTasks()
  const { runPromise } = useServiceContext()
  const [newResult, addNewTask] = useNewTask(
    category,
    !isDynamicCategory && category !== "tasks"
      ? (category as any as Todo.TaskListId)
      : undefined
  )
  const [findResult, getTask] = useGetTask()
  const isLoading =
    datumEither.isPending(newResult) || datumEither.isPending(findResult)
  const { setDirection, setOrder, setSelectedTaskId } = useRouting(category, order)

  const addTask = React.useMemo(
    () =>
      withLoading(
        flow(
          addNewTask,
          T.chain((r) => getTask(r.id)),
          EO.map((t) => setSelectedTaskId(t.id)),
          runPromise
        ),
        // TODO: or refreshing
        isLoading
      ),
    [addNewTask, getTask, isLoading, runPromise, setSelectedTaskId]
  )
  const isRefreshing = datumEither.isRefresh(tasksResult)
  function toggleDirection(dir: Todo.OrderDir) {
    setDirection(dir === "up" ? "down" : "up")
  }

  function renderTasks(unfilteredTasks: A.Array<Todo.Task>) {
    const listOrders = datumEither.isSuccess(meResult)
      ? category === "tasks"
        ? meResult.value.right.inboxOrder
        : A.findFirstMap_(meResult.value.right.lists, (l) =>
            l._tag === "TaskList" && l.id === (category as any)
              ? O.some(l.order)
              : O.none
          )["|>"](O.getOrElse(() => []))
      : []
    const tasks = unfilteredTasks["|>"](Todo.filterByCategory(category))
      ["|>"](A.reverse)
      ["|>"](
        A.sortBy(
          order["|>"](
            O.map((o) =>
              NA.single(Todo.orders[o.kind as any as keyof typeof Todo.orders])["|>"](
                NA.map((ord) => (o.dir === "down" ? ORD.inverted(ord) : ord))
              )
            )
          )["|>"](O.getOrElse(() => NA.single(makeOrderBySortingArrOrd(listOrders))))
        )
      )

    function reorder(tid: Todo.TaskId, did: Todo.TaskId) {
      // TODO: other custom view support
      if (Todo.TaskViews.includes(category as any)) {
        return
      }

      const t = tasks.find((x) => x.id === tid)!
      const d = tasks.find((x) => x.id === did)!
      const didx = tasks.findIndex((x) => x === d)
      const reorder = Todo.updateTaskIndex(t, didx)
      const reorderedTasks = reorder(tasks)
      const order = A.map_(reorderedTasks, (t) => t.id)
      modifyMe((r) => ({
        ...r,
        ...(category === "tasks"
          ? { inboxOrder: order }
          : {
              lists: A.map_(r.lists, (l) =>
                l.id === (category as any) && l._tag === "TaskList"
                  ? { ...l, order }
                  : l
              ),
            }),
      }))
      TodoClient.TasksClient.UpdateTaskListOrder({
        id: category === "tasks" ? "inbox" : (category as any),
        order,
      })["|>"](runWithErrorLog)
    }

    return (
      <>
        <Box display="flex">
          <Typography variant="h3">
            {toUpperCaseFirst(category)} {/* TODO */}
            {isRefreshing && <Refresh />}
          </Typography>

          <Box marginLeft="auto" marginTop={1}>
            <TaskListMenu
              setOrder={(o) => setOrder(O.some(o))}
              order={order["|>"](O.map((x) => x.kind))}
            />
          </Box>
        </Box>

        {renderIf_(order, (o) => (
          <div>
            {o.kind}
            <IconButton onClick={() => toggleDirection(o.dir)}>
              {o.dir === "up" ? <ArrowUp /> : <ArrowDown />}
            </IconButton>
            <Button onClick={() => setOrder(O.none)}>X</Button>
          </div>
        ))}

        <Box flexGrow={1} overflow="auto">
          <TaskList
            reorder={reorder}
            setSelectedTaskId={setSelectedTaskId}
            tasks={tasks}
          />
        </Box>

        <Box>
          <Field
            size="small"
            fullWidth
            placeholder="Add a Task"
            disabled={addTask.loading}
            onChange={flow(parseRSunsafe, addTask)}
          />
        </Box>
      </>
    )
  }

  return tasksResult["|>"](
    datumEither.fold(
      () => <div>Hi there... about to get us some Tasks</div>,
      () => <div>Getting us some tasks now..</div>,
      (err) => <>{"Error Refreshing tasks: " + JSON.stringify(err)}</>,
      renderTasks,
      (err) => <>{"Error Loading tasks: " + JSON.stringify(err)}</>,
      renderTasks
    )
  )
})

const TaskListOrNone = ({
  category,
  order,
}: {
  category: O.Option<Todo.Category>
  order: O.Option<Todo.Ordery>
}) =>
  O.fold_(
    category,
    () => <>List not found</>,
    (category) => <TaskListView category={category} order={order} />
  )

// function orderTasks(a: A.Array<Task>, order: A.Array<Todo.TaskId>) {
//   return A.reverse(a)["|>"](A.sort(makeOrderBySortingArrOrd(order)))
// }

function makeOrderBySortingArrOrd(sortingArr: A.Array<Todo.TaskId>): Ord<Todo.Task> {
  return {
    compare: (a, b) => {
      const diff = sortingArr.indexOf(a.id) - sortingArr.indexOf(b.id)
      return diff > 1 ? 1 : diff < 0 ? -1 : 0
    },
  }
}

export default TaskListOrNone
