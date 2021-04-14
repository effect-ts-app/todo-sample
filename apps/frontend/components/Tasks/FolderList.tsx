import { List, ListItem, ListItemText } from "@material-ui/core"
import Link from "next/link"
import React from "react"

import * as Todo from "@/Todo"
import { memo } from "@/data"

export const FolderList = memo(function ({
  folders,
}: {
  folders: readonly Todo.FolderListADT[]
}) {
  // TODO: dynamic TaskViews should show count
  return (
    <List component="nav">
      {folders.map((f, idx) =>
        Todo.FolderListADT.matchStrict({
          TaskListView: (c) => (
            <Link href={`/${c.slug}`} passHref key={c.slug}>
              <ListItem component="a" button>
                <ListItemText>
                  {c.title} ({c.count})
                </ListItemText>
              </ListItem>
            </Link>
          ),
          TaskList: (l) => <ListItem key={idx}>List {l.title}</ListItem>,
          TaskListGroup: (g) => (
            <React.Fragment key={idx}>
              {g.title}
              <List component="div">
                {g.lists.map((l, idx) => (
                  <ListItem key={idx}>List {l.title}</ListItem>
                ))}
              </List>
            </React.Fragment>
          ),
        })(f)
      )}
    </List>
  )
})
