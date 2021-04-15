import * as O from "@effect-ts/core/Option"
import { Box } from "@material-ui/core"
import React from "react"

import { memo } from "@/data"

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
    <Box display="flex" height="100%">
      <Box
        flexBasis="200px"
        style={{ backgroundColor: "#efefef" }}
        paddingX={1}
        paddingTop={7}
        paddingBottom={2}
        overflow="auto"
      >
        <FolderList category={category} />
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        flexGrow={1}
        paddingX={2}
        paddingBottom={2}
      >
        <TaskList category={category} order={order} />
      </Box>

      {O.isSome(taskId) && (
        <Box
          display="flex"
          flexBasis="300px"
          paddingX={2}
          paddingTop={2}
          paddingBottom={1}
          width="400px"
          style={{ backgroundColor: "#efefef" }}
        >
          <TaskDetail taskId={taskId.value} category={category} order={order} />
        </Box>
      )}
    </Box>
  )
})

export default TasksScreen
