import { List, ListItem, ListItemText } from "@material-ui/core"
import Link from "next/link"
import React from "react"

import * as Todo from "@/Todo"
import { memo } from "@/data"

import { TaskView } from "./data"
import { toUpperCaseFirst } from "./utils"

export const FolderList = memo(function ({
  folders,
}: {
  folders: readonly Todo.FolderListADT[]
}) {
  return (
    <List component="nav">
      {TaskView.map((c) => (
        <Link href={`/${c}`} passHref key={c}>
          <ListItem component="a" button>
            <ListItemText>{toUpperCaseFirst(c)}</ListItemText>
          </ListItem>
        </Link>
      ))}
      {folders.map((f, idx) =>
        Todo.FolderListADT.matchStrict({
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
