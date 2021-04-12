import * as T from "@effect-ts-demo/todo-types/ext/Effect"
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { constant, flow, identity, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import * as ORD from "@effect-ts/core/Ord"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuItem,
} from "@material-ui/core"
import ArrowDown from "@material-ui/icons/ArrowDownward"
import ArrowUp from "@material-ui/icons/ArrowUpward"
import OpenMenu from "@material-ui/icons/Menu"
import Refresh from "@material-ui/icons/Refresh"
import { datumEither } from "@nll/datum"
import React from "react"
import { useHistory, Route, useLocation } from "react-router"
import { Link } from "react-router-dom"
import useInterval from "use-interval"

import { useServiceContext } from "../context"
import { memo, useCallback } from "../data"

import TaskDetail from "./TaskDetail"
import TaskList from "./TaskList"
import * as Todo from "./Todo"
import { Field } from "./components"
import {
  TaskView,
  useDeleteTask,
  useGetTask,
  useNewTask,
  useTaskCommands,
  useTasks,
} from "./data"
import { toUpperCaseFirst, withLoading } from "./utils"

function FolderList_() {
  return (
    <List>
      {TaskView.map((c) => (
        <ListItem button component={Link} to={`/${c}`} key={c}>
          {toUpperCaseFirst(c)}
        </ListItem>
      ))}
    </List>
  )
}
const FolderList = memo(FolderList_)

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

const defaultDate = constant(new Date(1900, 1, 1))

const orders = {
  creation: ORD.contramap_(ORD.date, (t: Todo.Task) => t.createdAt),
  important: ORD.contramap_(ORD.inverted(ORD.boolean), (t: Todo.Task) => t.isFavorite),
  alphabetically: ORD.contramap_(ORD.string, (t: Todo.Task) => t.title.toLowerCase()),
  due: ORD.contramap_(ORD.inverted(ORD.date), (t: Todo.Task) =>
    O.getOrElse_(t.due, defaultDate)
  ),
  myDay: ORD.contramap_(ORD.inverted(ORD.date), (t: Todo.Task) =>
    O.getOrElse_(t.myDay, defaultDate)
  ),
}

type Orders = keyof typeof orders
type OrderDir = "up" | "down"

function TaskListMenu_({
  setOrder,
}: {
  order: O.Option<Orders>
  orderDirection: O.Option<OrderDir>
  setOrder: (o: O.Option<Orders>) => void
}) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const handleClose = () => {
    setAnchorEl(null)
  }
  return (
    <>
      <IconButton
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={(event) => {
          setAnchorEl(event.currentTarget)
        }}
      >
        <OpenMenu />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {Object.keys(orders).map((o) => (
          <MenuItem
            key={o}
            onClick={() => {
              setOrder(O.some(o as Orders))
              handleClose()
            }}
          >
            {o}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

const TaskListMenu = memo(TaskListMenu_)

export const Tasks = memo(function Tasks({
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

      <Box flexGrow={1} paddingX={2} paddingBottom={2} overflow="auto">
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

        <TaskList tasks={tasks} setSelectedTaskId={setSelectedTaskId} />
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
                overflow="auto"
                width="400px"
                style={{ backgroundColor: "#efefef" }}
              >
                <SelectedTask
                  task={t}
                  closeTaskDetail={() => setSelectedTaskId(null)}
                />
              </Box>
            )
          )
        }}
      />
    </Box>
  )
})

const AddTask_ = ({
  category,
  setSelectedTaskId,
}: {
  category: TaskView
  setSelectedTaskId: (i: UUID) => void
}) => {
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
      <Field placeholder="Add a Task" disabled={addTask.loading} onChange={addTask} />
    </div>
  )
}

const AddTask = memo(AddTask_)

const SelectedTask_ = ({
  closeTaskDetail,
  task: t,
}: {
  task: Todo.Task
  closeTaskDetail: () => void
}) => {
  const { runPromise } = useServiceContext()
  const [deleteResult, deleteTask] = useDeleteTask()
  const {
    addNewTaskStep,
    deleteTaskStep,
    editNote,
    findResult,
    modifyTasks,
    setDue,
    setReminder,
    setTitle,
    toggleTaskChecked,
    toggleTaskFavorite,
    toggleTaskMyDay,
    toggleTaskStepChecked,
    updateResult,
    updateStepIndex,
    updateStepTitle,
  } = useTaskCommands(t.id)

  const isRefreshingTask = datumEither.isRefresh(findResult)
  const isUpdatingTask = datumEither.isPending(updateResult) || isRefreshingTask

  return (
    <TaskDetail
      task={t}
      closeTaskDetail={closeTaskDetail}
      deleteTask={withLoading(
        () =>
          pipe(
            deleteTask(t.id),
            T.map(() =>
              modifyTasks((tasks) =>
                A.unsafeDeleteAt_(
                  tasks,
                  tasks.findIndex((x) => x.id === t.id)
                )
              )
            ),
            runPromise
          ),
        datumEither.isPending(deleteResult)
      )}
      toggleMyDay={withLoading(
        () => toggleTaskMyDay(t)["|>"](runPromise),
        isUpdatingTask
      )}
      toggleChecked={withLoading(
        () => toggleTaskChecked(t)["|>"](runPromise),
        isUpdatingTask
      )}
      toggleFavorite={withLoading(
        () => toggleTaskFavorite(t)["|>"](runPromise),
        isUpdatingTask
      )}
      toggleStepChecked={withLoading(
        flow(toggleTaskStepChecked(t), runPromise),
        isUpdatingTask
      )}
      setTitle={withLoading(flow(setTitle(t), runPromise), isUpdatingTask)}
      setDue={withLoading(flow(setDue(t), runPromise), isUpdatingTask)}
      setReminder={withLoading(flow(setReminder(t), runPromise), isUpdatingTask)}
      editNote={withLoading(flow(editNote(t), runPromise), isUpdatingTask)}
      addNewStep={withLoading(
        flow(addNewTaskStep(t), T.asUnit, runPromise),
        isUpdatingTask
      )}
      updateStepTitle={withLoading(
        (s: Todo.Step) => flow(updateStepTitle(t)(s), T.asUnit, runPromise),
        isUpdatingTask
      )}
      updateStepIndex={withLoading(
        (s: Todo.Step) => flow(updateStepIndex(t)(s), T.asUnit, runPromise),
        isUpdatingTask
      )}
      deleteStep={withLoading(flow(deleteTaskStep(t), runPromise), isUpdatingTask)}
    />
  )
}

const SelectedTask = memo(SelectedTask_)

function TasksScreen_({
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
}
const TasksScreen = memo(TasksScreen_)

export default TasksScreen
