import * as T from "@effect-ts-demo/todo-types/ext/Effect"
import * as EO from "@effect-ts-demo/todo-types/ext/EffectOption"
import * as A from "@effect-ts/core/Array"
import { flow, identity, pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { Box } from "@material-ui/core"
import Refresh from "@material-ui/icons/Refresh"
import { datumEither } from "@nll/datum"
import React, { memo, useCallback } from "react"
import { useHistory, Route } from "react-router"
import { Link } from "react-router-dom"
import styled from "styled-components"
import useInterval from "use-interval"

import { useServiceContext } from "../context"

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

const LinkBox = styled(Box)`
  > * {
    display: block;
  }
`

function FolderList_() {
  return (
    <LinkBox
      flexBasis="200px"
      style={{ backgroundColor: "#efefef" }}
      paddingX={1}
      paddingTop={7}
      paddingBottom={2}
    >
      {TaskView.map((c) => (
        <Link to={`/${c}`} key={c}>
          {toUpperCaseFirst(c)}
        </Link>
      ))}
    </LinkBox>
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

export const Tasks = memo(function Tasks({
  category,
  tasks: unfilteredTasks,
}: {
  category: TaskView
  tasks: A.Array<Todo.Task>
}) {
  const filter = filterByCategory(category)
  const tasks = filter(unfilteredTasks)

  const [tasksResult, , refetchTasks] = useTasks()

  useInterval(() => refetchTasks, 30 * 1000)

  const h = useHistory()
  const setSelectedTaskId = useCallback((id: UUID) => h.push(`/${category}/${id}`), [
    category,
    h,
  ])

  const isRefreshing = datumEither.isRefresh(tasksResult)

  return (
    <Box display="flex" height="100%">
      <FolderList />

      <Box flexGrow={1} paddingX={2} paddingBottom={2}>
        <h1>
          {toUpperCaseFirst(category)} {isRefreshing && <Refresh />}
        </h1>

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
          return t && <SelectedTask task={t} />
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

const SelectedTask_ = ({ task: t }: { task: Todo.Task }) => {
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
    updateStepTitle,
  } = useTaskCommands(t.id)

  const isRefreshingTask = datumEither.isRefresh(findResult)
  const isUpdatingTask = datumEither.isPending(updateResult) || isRefreshingTask

  return (
    <Box
      display="flex"
      flexBasis="300px"
      paddingX={2}
      paddingTop={2}
      paddingBottom={1}
      style={{ backgroundColor: "#efefef", width: "400px" }}
    >
      <TaskDetail
        task={t}
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
        deleteStep={withLoading(flow(deleteTaskStep(t), runPromise), isUpdatingTask)}
      />
    </Box>
  )
}

const SelectedTask = memo(SelectedTask_)

function TasksScreen_({ category }: { category: string }) {
  const [tasksResult] = useTasks()
  // testing for multi-call relying on same network-call/cache.
  //   useTasks()
  //   useTasks()

  return tasksResult["|>"](
    datumEither.fold(
      () => <div>Hi there... about to get us some Tasks</div>,
      () => <div>Getting us some tasks now..</div>,
      (err) => <>{"Error Refreshing tasks: " + JSON.stringify(err)}</>,
      (tasks) => <Tasks tasks={tasks} category={category as TaskView} />,
      (err) => <>{"Error Loading tasks: " + JSON.stringify(err)}</>,
      (tasks) => <Tasks tasks={tasks} category={category as TaskView} />
    )
  )
}
const TasksScreen = memo(TasksScreen_)

export default TasksScreen
