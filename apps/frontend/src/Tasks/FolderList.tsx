import { List, ListItem } from "@material-ui/core"
import React from "react"
import { Link } from "react-router-dom"

import { memo } from "../data"

import { TaskView } from "./data"
import { toUpperCaseFirst } from "./utils"

export const FolderList = memo(function () {
  return (
    <List>
      {TaskView.map((c) => (
        <ListItem button component={Link} to={`/${c}`} key={c}>
          {toUpperCaseFirst(c)}
        </ListItem>
      ))}
    </List>
  )
})
