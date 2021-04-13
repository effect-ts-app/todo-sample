import * as T from "@effect-ts-demo/todo-types/ext/Effect"
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { flow, identity } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { Box, Button, IconButton } from "@material-ui/core"
import ArrowDown from "@material-ui/icons/ArrowDownward"
import ArrowUp from "@material-ui/icons/ArrowUpward"
import Refresh from "@material-ui/icons/Refresh"
import { datumEither } from "@nll/datum"
import React from "react"
import { useHistory, Route, useLocation } from "react-router"
import useInterval from "use-interval"

import { useServiceContext } from "../context"
import { memo, useCallback } from "../data"

import { FolderList } from "./FolderList"
import { TaskDetail } from "./TaskDetail"
import TaskList from "./TaskList"
import { TaskListMenu } from "./TaskListMenu"
import * as Todo from "./Todo"
import { Field } from "./components"
import {
  OrderDir,
  orders,
  Orders,
  TaskView,
  useGetTask,
  useNewTask,
  useTasks,
} from "./data"
import { toUpperCaseFirst, withLoading } from "./utils"

function isSameDay(today: Date) {
  return (someDate: Date) => {
    return (
      someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
    )
  }
}

function filterByCategory(category: TaskView) {
  switch (category) {
    case "important":
      return A.filter((t: Todo.Task) => t.isFavorite)
    case "my-day": {
      const isToday = isSameDay(new Date())
      return A.filter((t: Todo.Task) =>
        t.myDay["|>"](O.map(isToday))["|>"](O.getOrElse(() => false))
      )
    }
    default:
      return identity
  }
}

const Tasks = memo(function ({
  category,
  order,
  orderDirection,
  tasks: unfilteredTasks,
}: {
  category: TaskView
  tasks: A.Array<Todo.Task>
  order: O.Option<Orders>
  orderDirection: O.Option<OrderDir>
}) {
  const filter = filterByCategory(category)
  const orderDir = orderDirection["|>"](O.getOrElse(() => "up"))

  const ordering = order["|>"](O.chain((o) => O.fromNullable(orders[o])))
    ["|>"](O.map(A.single))
    ["|>"](O.getOrElse(() => [] as A.Array<ORD.Ord<Todo.Task>>))
    ["|>"](A.map((o) => (orderDir === "down" ? ORD.inverted(o) : o)))
  const tasks = unfilteredTasks["|>"](filter)["|>"](A.sortBy(ordering))

  const [tasksResult, , refetchTasks] = useTasks()

  useInterval(() => refetchTasks, 30 * 1000)

  const h = useHistory()
  const location = useLocation()

  const setDirection = useCallback(
    (dir: OrderDir) => h.push(`${location.pathname}${makeSearch(order, O.some(dir))}`),
    [h, location.pathname, order]
  )

  const makeSearch = (o: O.Option<Orders>, dir: O.Option<OrderDir>) =>
    O.fold_(
      o,
      () => "",
      (o) => `?order=${o}&orderDirection=${dir["|>"](O.getOrElse(() => "up"))}`
    )

  const setSelectedTaskId = useCallback(
    (id: UUID | null) =>
      h.push(`/${category}${id ? `/${id}` : ""}${makeSearch(order, orderDirection)}`),
    [category, h, order, orderDirection]
  )

  const setOrder = useCallback(
    (o) => h.push(`${location.pathname}${makeSearch(o, orderDirection)}`),
    [h, location.pathname, orderDirection]
  )

  const isRefreshing = datumEither.isRefresh(tasksResult)

  return (
    <Box display="flex" height="100%">
      <Box
        flexBasis="200px"
        style={{ backgroundColor: "#efefef" }}
        paddingX={1}
        paddingTop={7}
        paddingBottom={2}
        overflow="auto"
      >
        <FolderList />
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        flexGrow={1}
        paddingX={2}
        paddingBottom={2}
      >
        <Box display="flex">
          <h1>
            {toUpperCaseFirst(category)} {isRefreshing && <Refresh />}
          </h1>

          <Box marginLeft="auto" marginTop={1}>
            <TaskListMenu
              setOrder={setOrder}
              order={order}
              orderDirection={orderDirection}
            />
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
          <TaskList tasks={tasks} setSelectedTaskId={setSelectedTaskId} />
        </Box>
        <AddTask category={category} setSelectedTaskId={setSelectedTaskId} />
      </Box>

      <Route
        path={`/${category}/:id`}
        render={({
          match: {
            params: { id },
          },
        }) => {
          const t = tasks.find((x) => x.id === id)
          return (
            t && (
              <Box
                display="flex"
                flexBasis="300px"
                paddingX={2}
                paddingTop={2}
                paddingBottom={1}
                width="400px"
                style={{ backgroundColor: "#efefef" }}
              >
                <TaskDetail task={t} closeTaskDetail={() => setSelectedTaskId(null)} />
              </Box>
            )
          )
        }}
      />
    </Box>
  )
})

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

const TasksScreen = memo(function ({
  category,
  order,
  orderDirection,
}: {
  category: string
  order: string | null
  orderDirection: string | null
}) {
  const [tasksResult] = useTasks()
  // testing for multi-call relying on same network-call/cache.
  //   useTasks()
  //   useTasks()

  return tasksResult["|>"](
    datumEither.fold(
      () => <div>Hi there... about to get us some Tasks</div>,
      () => <div>Getting us some tasks now..</div>,
      (err) => <>{"Error Refreshing tasks: " + JSON.stringify(err)}</>,
      (tasks) => (
        <Tasks
          tasks={tasks}
          category={category as TaskView}
          order={O.fromNullable(order) as O.Option<Orders>}
          orderDirection={O.fromNullable(orderDirection) as O.Option<OrderDir>}
        />
      ),
      (err) => <>{"Error Loading tasks: " + JSON.stringify(err)}</>,
      (tasks) => (
        <Tasks
          tasks={tasks}
          category={category as TaskView}
          order={O.fromNullable(order) as O.Option<Orders>}
          orderDirection={O.fromNullable(orderDirection) as O.Option<OrderDir>}
        />
      )
    )
  )
})

export default TasksScreen
