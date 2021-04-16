import * as O from "@effect-ts/core/Option"
import { List, ListItem, ListItemText } from "@material-ui/core"
import Link from "next/link"
import React from "react"

import * as Todo from "@/Todo"
import { memo } from "@/data"

import { TaskView } from "../data"

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
