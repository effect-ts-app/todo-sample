/* eslint-disable react/display-name */
import * as O from "@effect-ts/core/Option"
import { List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core"
import CalendarToday from "@material-ui/icons/CalendarToday"
import Home from "@material-ui/icons/Home"
import Star from "@material-ui/icons/Star"
import Link from "next/link"
import React from "react"

import * as Todo from "@/Todo"
import { memo } from "@/data"

import { TaskView } from "../data"

const icons: Record<string, JSX.Element> = {
  tasks: <Home />,
  important: <Star />,
  "my-day": <CalendarToday />,
}

export const FolderList = memo(function ({
  category,
  folders,
}: {
  folders: readonly Todo.FolderListADT[]
  category: O.Option<TaskView>
}) {
  const cat = O.toNullable(category)
  // TODO: dynamic TaskViews should show count
  return (
    <List component="nav">
      {folders.map((f, idx) => (
        <React.Fragment key={idx}>
          {Todo.FolderListADT.matchStrict({
            TaskListView: (c) => (
              <Link href={`/${c.slug}`} passHref>
                <ListItem component="a" button selected={c.slug === cat}>
                  {icons[c.slug] && <ListItemIcon>{icons[c.slug]}</ListItemIcon>}
                  <ListItemText>
                    {c.title} ({c.count})
                  </ListItemText>
                </ListItem>
              </Link>
            ),
            TaskList: (l) => <ListItem>List {l.title}</ListItem>,
            TaskListGroup: (g) => (
              <React.Fragment>
                {g.title}
                <List component="div">
                  {g.lists.map((l, idx) => (
                    <ListItem key={idx}>List {l.title}</ListItem>
                  ))}
                </List>
              </React.Fragment>
            ),
          })(f)}
        </React.Fragment>
      ))}
    </List>
  )
})
