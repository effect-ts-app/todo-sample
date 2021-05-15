/* eslint-disable react/display-name */
import * as S from "@effect-ts-demo/core/ext/Schema"
import * as O from "@effect-ts/core/Option"
import { Box, List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core"
import Balance from "@material-ui/icons/AccountBalance"
import CalendarToday from "@material-ui/icons/CalendarToday"
import Calendar from "@material-ui/icons/CalendarViewMonth"
import Home from "@material-ui/icons/Home"
import Star from "@material-ui/icons/Star"
import Link from "next/link"
import { Draggable, Droppable } from "react-beautiful-dnd"
import React from "react"

import { memo } from "@/data"
import { Todo } from "@/index"

const icons: Record<string, JSX.Element> = {
  all: <Balance />,
  tasks: <Home />,
  planned: <Calendar />,
  important: <Star />,
  "my-day": <CalendarToday />,
}

function TLV(c: Todo.TaskListView) {
  const cat = "a"
  return (
    <Link href={`/${c.slug}`} passHref>
      <ListItem component="a" button selected={c.slug === cat}>
        {icons[c.slug] && <ListItemIcon>{icons[c.slug]}</ListItemIcon>}
        <ListItemText>
          {c.title} ({c.count})
        </ListItemText>
      </ListItem>
    </Link>
  )
}

function TLG(g: Todo.TaskListGroup) {
  return (
    <React.Fragment>
      {g.title}
      <Droppable droppableId={g.id}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <List component="div" disablePadding>
              {g.lists.map((l, idx) => (
                <Draggable key={idx} draggableId={l.id} index={idx}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      display="flex"
                    >
                      <TaskListEntry
                        {...l}
                        title={("| -- " + l.title) as S.NonEmptyString}
                      />
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          </Box>
        )}
      </Droppable>
    </React.Fragment>
  )
}

function TaskListEntry(l: Todo.TaskList) {
  const cat = "a"
  return (
    <Link href={`/${l.id}`} passHref>
      <ListItem sx={{ pl: 4 }} button selected={l.id === cat}>
        {l.title} {l.count ? `(${l.count})` : null}
      </ListItem>
    </Link>
  )
}
export const FolderList = memo(function ({
  //category,
  folders,
  name,
}: {
  folders: readonly Todo.FolderListADT[]
  category: O.Option<Todo.Category>
  name: string | null
}) {
  //const cat = O.toNullable(category)

  return (
    <>
      <Box>{name}</Box>
      <List component="nav">
        {folders.map((f, idx) => (
          <React.Fragment key={idx}>
            {Todo.FolderListADT.Api.matchS({
              TaskListView: TLV,
              TaskList: TaskListEntry,
              TaskListGroup: TLG,
            })(f)}
          </React.Fragment>
        ))}
      </List>
    </>
  )
})
