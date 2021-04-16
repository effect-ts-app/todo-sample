import * as O from "@effect-ts/core/Option"
import { Box, Link, Typography } from "@material-ui/core"
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
      <Box display="flex" height="100%">
        <Box
          flexBasis="200px"
          paddingX={1}
          paddingTop={7}
          paddingBottom={2}
          overflow="auto"
          style={{ backgroundColor: "#efefef" }}
        >
          <FolderList category={category} />
        </Box>

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

        {renderIf_(O.struct({ taskId, category }), ({ category, taskId }) => (
          <Box
            display="flex"
            flexBasis="300px"
            paddingX={2}
            paddingTop={2}
            paddingBottom={1}
            width="400px"
            style={{ backgroundColor: "#efefef" }}
          >
            <TaskDetail taskId={taskId} category={category} order={order} />
          </Box>
        ))}
      </Box>
    </Box>
  )
})

export default TasksScreen
