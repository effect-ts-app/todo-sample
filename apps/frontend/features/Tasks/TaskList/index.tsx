import * as NA from "@effect-ts/core/Collections/Immutable/NonEmptyArray"
import { flow } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { Box, Button, IconButton, Typography } from "@material-ui/core"
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
import { renderIf_, toUpperCaseFirst } from "@/utils"

import {
  filterByCategory,
  OrderDir,
  orders,
  Ordery,
  useGetTask,
  useNewTask,
  useTasks,
} from "../data"
import { useRouting } from "../routing"

import TaskList from "./TaskList"
import { TaskListMenu } from "./TaskListMenu"

import * as A from "@effect-ts-demo/core/ext/Array"
import * as T from "@effect-ts-demo/core/ext/Effect"
import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import { TaskListId } from "@effect-ts-demo/todo-types/Task"

const TaskListView = memo(function ({
  category,
  order,
}: {
  category: NonEmptyString
  order: O.Option<Ordery>
}) {
  const [tasksResult1, , refetchTasks] = useTasks()
  const isDynamicCategory = category === "my-day" || category === "important"
  const tasksResult = tasksResult1
  useInterval(() => refetchTasks, 30 * 1000)
  // testing for multi-call relying on same network-call/cache.
  //   useTasks()
  //   useTasks()
  const { runPromise } = useServiceContext()
  const [newResult, addNewTask] = useNewTask(
    category,
    !isDynamicCategory && category !== "tasks"
      ? ((category as any) as TaskListId)
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
  function toggleDirection(dir: OrderDir) {
    setDirection(dir === "up" ? "down" : "up")
  }

  function renderTasks(unfilteredTasks: A.Array<Todo.Task>) {
    const tasks = unfilteredTasks["|>"](filterByCategory(category))["|>"](
      A.sortByO(
        order["|>"](
          O.map((o) =>
            NA.single(orders[o.kind])["|>"](
              NA.map((ord) => (o.dir === "down" ? ORD.inverted(ord) : ord))
            )
          )
        )
      )
    )

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
          <TaskList setSelectedTaskId={setSelectedTaskId} tasks={tasks} />
        </Box>

        <Box>
          <Field
            size="small"
            fullWidth
            placeholder="Add a Task"
            disabled={addTask.loading}
            onChange={addTask}
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
  category: O.Option<NonEmptyString>
  order: O.Option<Ordery>
}) =>
  O.fold_(
    category,
    () => <>List not found</>,
    (category) => <TaskListView category={category} order={order} />
  )

export default TaskListOrNone
