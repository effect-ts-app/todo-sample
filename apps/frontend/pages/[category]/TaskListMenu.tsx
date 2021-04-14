import * as O from "@effect-ts/core/Option"
import { IconButton, Menu, MenuItem } from "@material-ui/core"
import OpenMenu from "@material-ui/icons/Menu"
import React from "react"

import { memo } from "../../data"

import { OrderDir, Orders, orders } from "./data"

export const TaskListMenu = memo(function ({
  setOrder,
}: {
  order: O.Option<Orders>
  orderDirection: O.Option<OrderDir>
  setOrder: (o: O.Option<Orders>) => void
}) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const handleClose = () => {
    setAnchorEl(null)
  }
  return (
    <>
      <IconButton
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={(event) => {
          setAnchorEl(event.currentTarget)
        }}
      >
        <OpenMenu />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {Object.keys(orders).map((o) => (
          <MenuItem
            key={o}
            onClick={() => {
              setOrder(O.some(o as Orders))
              handleClose()
            }}
          >
            {o}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
})
