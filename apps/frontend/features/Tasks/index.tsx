import * as O from "@effect-ts/core/Option"
import { Box, Hidden, Link, Typography } from "@material-ui/core"
import ArrowLeft from "@material-ui/icons/ArrowLeft"
import RouterLink from "next/link"
import React from "react"

import { memo } from "@/data"
import { renderIf_ } from "@/utils"

import FolderList from "./FolderList"
import TaskDetail from "./TaskDetail"
import TaskList from "./TaskList"
import { Ordery, TaskView } from "./data"

import { UUID } from "@/../../packages/types/shared"

const TasksScreen = memo(function ({
  category,
  order,
  taskId,
}: {
  category: O.Option<TaskView>
  order: O.Option<Ordery>
  taskId: O.Option<UUID>
}) {
  const view = O.isSome(taskId) ? "task" : O.isSome(category) ? "tasks" : "folders"
  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText" }} p={2}>
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
      </Box>
      <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} height="100%">
        <Hidden only={view === "folders" ? undefined : "xs"}>
          <Box
            flexBasis="200px"
            flexGrow={{ xs: view === "folders" ? 1 : undefined, sm: undefined }}
            paddingX={1}
            paddingTop={7}
            paddingBottom={2}
            overflow="auto"
            style={{ backgroundColor: "#efefef" }}
          >
            <FolderList category={category} />
          </Box>
        </Hidden>

        <Hidden only={view === "tasks" ? undefined : "xs"}>
          <Hidden smUp>
            <Box>
              <RouterLink href="/" passHref>
                <Link>
                  <ArrowLeft />
                  Back to Folders
                </Link>
              </RouterLink>
            </Box>
          </Hidden>
          <Box
            display="flex"
            flexDirection="column"
            flexGrow={1}
            paddingX={2}
            paddingBottom={2}
            sx={{ bgcolor: "info.main", color: "info.contrastText" }}
          >
            <TaskList category={category} order={order} />
          </Box>
        </Hidden>

        {renderIf_(O.struct({ taskId, category }), ({ category, taskId }) => (
          <Hidden only={view === "task" ? undefined : "xs"}>
            <Hidden smUp>
              <Box>
                <RouterLink href={`/${category}`} passHref>
                  <Link>
                    <ArrowLeft />
                    Back to List
                  </Link>
                </RouterLink>
              </Box>
            </Hidden>
            <Box
              display="flex"
              flexBasis="300px"
              paddingX={2}
              paddingTop={2}
              paddingBottom={1}
              flexGrow={{ xs: view === "task" ? 1 : undefined, sm: undefined }}
              width={{ xs: view === "task" ? undefined : "400px", sm: "400px" }}
              style={{ backgroundColor: "#efefef" }}
            >
              <TaskDetail taskId={taskId} category={category} order={order} />
            </Box>
          </Hidden>
        ))}
      </Box>
    </Box>
  )
})

export default TasksScreen
