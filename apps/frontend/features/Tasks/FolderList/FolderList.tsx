/* eslint-disable react/display-name */
import * as O from "@effect-ts/core/Option"
import { Box, List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core"
import CalendarToday from "@material-ui/icons/CalendarToday"
import Home from "@material-ui/icons/Home"
import Star from "@material-ui/icons/Star"
import Link from "next/link"
import React from "react"

import * as Todo from "@/Todo"
import { memo } from "@/data"

import { NonEmptyString } from "@effect-ts-demo/core/ext/Model"

const icons: Record<string, JSX.Element> = {
  tasks: <Home />,
  important: <Star />,
  "my-day": <CalendarToday />,
}

function TLV(c) {
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

function TLG(g) {
  return (
    <React.Fragment>
      {g.title}
      <List component="div" disablePadding>
        {g.lists.map((l, idx) => (
          <React.Fragment key={idx}>
            <TaskListEntry {...l} title={"| -- " + l.title} />
          </React.Fragment>
        ))}
      </List>
    </React.Fragment>
  )
}
function TaskListEntry(l: { id: string; title: string; count: number }) {
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
  category: O.Option<NonEmptyString>
  name: string | null
}) {
  //const cat = O.toNullable(category)

  return (
    <>
      <Box>{name}</Box>
      <List component="nav">
        {folders.map((f, idx) => (
          <React.Fragment key={idx}>
            {Todo.FolderListADT.matchStrict({
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
