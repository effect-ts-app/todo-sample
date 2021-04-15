import * as T from "@effect-ts-demo/todo-types/ext/Effect"
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { Box, Button, IconButton } from "@material-ui/core"
import ArrowDown from "@material-ui/icons/ArrowDownward"
import ArrowUp from "@material-ui/icons/ArrowUpward"
import Refresh from "@material-ui/icons/Refresh"
import { datumEither } from "@nll/datum"
import React from "react"
import useInterval from "use-interval"

import * as Todo from "@/Todo"
import { Field } from "@/components"
import { useServiceContext } from "@/context"
import { memo, withLoading } from "@/data"
import { toUpperCaseFirst } from "@/utils"

import {
  filterByCategory,
  OrderDir,
  orders,
  Orders,
  TaskView,
  useGetTask,
  useNewTask,
  useTasks,
} from "../data"
import { useRouting } from "../routing"

import TaskList from "./TaskList"
import { TaskListMenu } from "./TaskListMenu"

const AddTask = memo(function ({
  category,
  setSelectedTaskId,
}: {
  category: TaskView
  setSelectedTaskId: (i: UUID) => void
}) {
  const { runPromise } = useServiceContext()
  const [newResult, addNewTask] = useNewTask(category)

  const [findResult, getTask] = useGetTask()

  const addTask = withLoading(
    flow(
      addNewTask,
      T.chain((r) => getTask(r.id)),
      EO.map((t) => setSelectedTaskId(t.id)),
      runPromise
    ),
    // TODO: or refreshing
    datumEither.isPending(newResult) || datumEither.isPending(findResult)
  )
  return (
    <div>
      <Field
        size="small"
        fullWidth
        placeholder="Add a Task"
        disabled={addTask.loading}
        onChange={addTask}
      />
    </div>
  )
})

const TaskListView = memo(function ({
  category,
  order,
  orderDirection,
}: {
  category: TaskView
  order: O.Option<Orders>
  orderDirection: O.Option<OrderDir>
}) {
  const [tasksResult, , refetchTasks] = useTasks()

  useInterval(() => refetchTasks, 30 * 1000)

  // testing for multi-call relying on same network-call/cache.
  //   useTasks()
  //   useTasks()

  const filter = filterByCategory(category)
  const orderDir = orderDirection["|>"](O.getOrElse(() => "up"))

  const ordering = order["|>"](O.map((o) => orders[o]))
    ["|>"](O.map(A.single))
    ["|>"](O.getOrElse(() => [] as A.Array<ORD.Ord<Todo.Task>>))
    ["|>"](A.map((o) => (orderDir === "down" ? ORD.inverted(o) : o)))

  const { setDirection, setOrder, setSelectedTaskId } = useRouting(
    category,
    order,
    orderDirection
  )
  const isRefreshing = datumEither.isRefresh(tasksResult)

  function renderTasks(unfilteredTasks: A.Array<Todo.Task>) {
    const tasks = unfilteredTasks["|>"](filter)["|>"](A.sortBy(ordering))

    return (
      <>
        <Box display="flex">
          <h1>
            {toUpperCaseFirst(category)} {isRefreshing && <Refresh />}
          </h1>

          <Box marginLeft="auto" marginTop={1}>
            <TaskListMenu setOrder={setOrder} order={order} />
          </Box>
        </Box>

        {O.isSome(order) && (
          <div>
            {order.value}
            <IconButton onClick={() => setDirection(orderDir === "up" ? "down" : "up")}>
              {orderDir === "up" ? <ArrowUp /> : <ArrowDown />}
            </IconButton>
            <Button onClick={() => setOrder(O.none)}>X</Button>
          </div>
        )}

        <Box flexGrow={1} overflow="auto">
          <TaskList setSelectedTaskId={setSelectedTaskId} tasks={tasks} />
        </Box>
        <AddTask category={category} setSelectedTaskId={setSelectedTaskId} />
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
  orderDirection,
}: {
  category: O.Option<TaskView>
  order: O.Option<Orders>
  orderDirection: O.Option<OrderDir>
}) =>
  O.fold_(
    category,
    () => <>List not found</>,
    (category) => (
      <TaskListView category={category} order={order} orderDirection={orderDirection} />
    )
  )

export default TaskListOrNone
