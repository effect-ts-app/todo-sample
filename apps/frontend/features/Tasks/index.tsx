import { useUser } from "@auth0/nextjs-auth0"
import * as O from "@effect-ts/core/Option"
import { Box, Link, Typography } from "@mui/material"
import ArrowLeft from "@mui/material-icons/ArrowLeft"
import RouterLink from "next/link"
import React, { useState } from "react"

import { memo, useEffect } from "@/data"
import { Todo } from "@/index"
import { renderIf_ } from "@/utils"

import FolderList from "./FolderList"
import TaskDetail from "./TaskDetail"
import TaskList from "./TaskList"
import { Ordery } from "./data"

const users = [
  {
    id: "0",
    name: "Patrick",
  },
  {
    id: "1",
    name: "Mike",
  },
  {
    id: "2",
    name: "Markus",
  },
]

function LoginOut() {
  const { error, isLoading, user } = useUser()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>{error.message}</div>

  if (user) {
    return (
      <div>
        Welcome {user.name}! <a href="/api/auth/logout">Logout</a>
      </div>
    )
  }
  return <a href="/api/auth/login">Login</a>
}

const TasksScreen = memo(function ({
  category,
  order,
  taskId,
}: {
  category: O.Option<Todo.Category>
  order: O.Option<Ordery>
  taskId: O.Option<Todo.TaskId>
}) {
  const userId = useUserId()
  const view = O.isSome(taskId) ? "task" : O.isSome(category) ? "tasks" : "folders"
  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box
        sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
        p={2}
        display="flex"
      >
        <Box flexGrow={1}>
          <Typography>
            To Do: An Effect-TS full-stack demo, clone of Microsoft To Do.{" "}
            <Link
              sx={{ color: "primary.contrastText" }}
              href="http://github.com/patroza/effect-ts-demo-todo"
              target="_blank"
            >
              <i>Fork Me</i>
            </Link>
          </Typography>
          <LoginOut />
        </Box>
        <Box display="flex">
          Switch to
          {users
            .filter((u) => u.id.toString() !== userId)
            .map((u, idx) => (
              <React.Fragment key={u.id}>
                {idx ? "," : ":"}&nbsp;
                <Link href={`/set-user/${u.id}`} sx={{ color: "primary.contrastText" }}>
                  {u.name}
                </Link>
              </React.Fragment>
            ))}
        </Box>
      </Box>
      <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} height="100%">
        <Box
          sx={{ display: view === "folders" ? undefined : { xs: "none", sm: "block" } }}
        >
          <Box
            flexBasis="200px"
            flexGrow={view === "folders" ? { xs: 1, sm: 0 } : undefined}
            paddingX={1}
            paddingTop={7}
            paddingBottom={2}
            overflow="auto"
            style={{ backgroundColor: "#efefef" }}
          >
            <FolderList category={category} />
          </Box>
        </Box>

        <Box
          sx={{ display: view === "tasks" ? undefined : { xs: "none", sm: "block" } }}
          flexGrow={1}
        >
          <Box sx={{ display: { sm: "none" } }}>
            <RouterLink href="/" passHref>
              <Link>
                <ArrowLeft />
                Back to Folders
              </Link>
            </RouterLink>
          </Box>
          {renderIf_(category, () => (
            <Box
              display="flex"
              flexDirection="column"
              paddingX={2}
              paddingBottom={2}
              sx={{ bgcolor: "info.main", color: "info.contrastText" }}
            >
              <TaskList category={category} order={order} />
            </Box>
          ))}
        </Box>

        {renderIf_(O.struct({ taskId, category }), ({ category, taskId }) => (
          <Box
            sx={{ display: view === "task" ? undefined : { xs: "none", sm: "block" } }}
          >
            <Box sx={{ display: { sm: "none" } }}>
              <RouterLink href={`/${category}`} passHref>
                <Link>
                  <ArrowLeft />
                  Back to List
                </Link>
              </RouterLink>
            </Box>
            <Box
              display="flex"
              flexBasis="300px"
              paddingX={2}
              paddingTop={2}
              paddingBottom={1}
              flexGrow={view === "task" ? { xs: 1, sm: 0 } : undefined}
              width={{ xs: view === "task" ? undefined : "400px", sm: "400px" }}
              style={{ backgroundColor: "#efefef" }}
            >
              <TaskDetail taskId={taskId} category={category} order={order} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
})

function useUserId() {
  const [userId, setUserId] = useState("0")
  useEffect(() => {
    setUserId(window.sessionStorage.getItem("user-id") ?? "0")
  }, [])

  return userId
}

export default TasksScreen
