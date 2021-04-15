import * as O from "@effect-ts/core/Option"
import { IconButton, Menu, MenuItem } from "@material-ui/core"
import OpenMenu from "@material-ui/icons/Menu"
import React from "react"

import { memo } from "@/data"
import { typedKeysOf } from "@/utils"

import { Orders, orders } from "../data"

export const TaskListMenu = memo(function ({
  order,
  setOrder,
}: {
  order: O.Option<Orders>
  setOrder: (o: O.Option<Orders>) => void
}) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const handleClose = () => {
    setAnchorEl(null)
  }
  const order_ = order["|>"](O.toNullable)
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
        open={Boolean(anchorEl)}
        onClose={handleClose}
        keepMounted
      >
        {typedKeysOf(orders).map((o) => (
          <MenuItem
            key={o}
            selected={order_ === o}
            onClick={() => {
              setOrder(O.some(o))
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
