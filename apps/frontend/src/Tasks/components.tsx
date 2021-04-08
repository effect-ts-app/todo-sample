import { IconButton, TextField, TextFieldProps } from "@material-ui/core"
import { Favorite, FavoriteBorder } from "@material-ui/icons"
import React, { useState, createRef, useEffect } from "react"
import styled, { css } from "styled-components"

export const Clickable = styled.div`
  ${ClickableMixin}
`

export const Completable = styled.div<{ completed: boolean }>`
  ${({ completed }) =>
    completed &&
    css`
      text-decoration: line-through;
    `}
`

export function TextFieldWithEditor({
  children,
  initialValue,
  loading,
  multiline,
  onChange,
  renderTextField: Field = TextField,
}: {
  children: React.ReactNode
  onChange: (note: string, onSuc: () => void) => void
  loading: boolean
  initialValue: string
  multiline?: boolean
  renderTextField?: (p: TextFieldProps) => JSX.Element
}) {
  const [editing, setEditing] = useState(false)
  const editor = createRef<HTMLInputElement>()
  useEffect(() => {
    editor?.current?.focus()
  }, [])
  const [note, setNote] = useState(initialValue)

  const submit = () => onChange(note, () => setEditing(false))

  return editing ? (
    <Field
      multiline={multiline}
      inputRef={editor}
      value={note}
      disabled={loading}
      onKeyPress={multiline ? undefined : (evt) => evt.charCode === 13 && submit()}
      onBlur={submit}
      onChange={(evt) => setNote(evt.target.value)}
    />
  ) : (
    <Clickable style={{ display: "inline" }} onClick={() => setEditing(true)}>
      {children}
    </Clickable>
  )
}

export function FavoriteButton({
  disabled,
  isFavorite,
  toggleFavorite,
}: {
  disabled: boolean
  toggleFavorite: () => void
  isFavorite: boolean
}) {
  return (
    <IconButton disabled={disabled} onClick={() => toggleFavorite()}>
      {isFavorite ? <Favorite /> : <FavoriteBorder />}
    </IconButton>
  )
}

export interface ClickableMixinProps {
  onClick?: () => void
}

export function ClickableMixin({ onClick }: ClickableMixinProps) {
  return (
    onClick &&
    css`
      cursor: pointer;
    `
  )
}

export interface StateMixinProps {
  state?: "warn" | "error" | null
}
export function StateMixin({ state }: StateMixinProps) {
  return css`
    color: ${state === "warn" ? "yellow" : state === "error" ? "red" : "inherit"};
  `
}
