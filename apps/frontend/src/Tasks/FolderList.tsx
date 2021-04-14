import { List, ListItem } from "@material-ui/core"
import React from "react"
import { Link } from "react-router-dom"

import { memo } from "../data"

import * as Todo from "./Todo"
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
        <ListItem button component={Link} to={`/${c}`} key={c}>
          {toUpperCaseFirst(c)}
        </ListItem>
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
                ))}{" "}
              </List>
            </React.Fragment>
          ),
        })(f)
      )}
    </List>
  )
})
