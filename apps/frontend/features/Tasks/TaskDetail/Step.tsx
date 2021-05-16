import { Box, Checkbox, IconButton } from "@material-ui/core"
import Delete from "@material-ui/icons/Delete"
import React from "react"
import { Draggable } from "react-beautiful-dnd"

import { Completable, TextFieldWithEditor } from "@/components"
import { onSuccess, PromiseExit, WithLoading } from "@/data"
import { Todo } from "@/index"

export function Step({
  deleteStep,
  index,
  step: s,
  toggleChecked,
  updateTitle,
}: {
  step: Todo.Step
  index: number
  toggleChecked: WithLoading<() => void>
  updateTitle: WithLoading<(newTitle: string) => PromiseExit>
  deleteStep: WithLoading<() => void>
}) {
  return (
    <Draggable draggableId={index.toString()} index={index}>
      {(provided) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          display="flex"
        >
          <Box flexGrow={1}>
            <Checkbox
              disabled={toggleChecked.loading}
              checked={s.completed}
              onChange={toggleChecked}
            />
            <TextFieldWithEditor
              loading={updateTitle.loading}
              initialValue={s.title}
              onChange={(title, onSuc) => {
                updateTitle(title).then(onSuccess(onSuc))
              }}
            >
              <Completable as="span" $completed={s.completed}>
                {s.title}
              </Completable>
            </TextFieldWithEditor>
          </Box>
          <Box>
            <IconButton disabled={deleteStep.loading} onClick={deleteStep}>
              <Delete />
            </IconButton>
          </Box>
        </Box>
      )}
    </Draggable>
  )
}
