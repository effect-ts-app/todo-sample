import { NonEmptyString } from "@effect-ts-demo/todo-types/shared"
import { IconButton, TextField, TextFieldProps } from "@material-ui/core"
import Favorite from "@material-ui/icons/Favorite"
import FavoriteBorder from "@material-ui/icons/FavoriteBorder"
import React, { useState, useRef, useEffect, MouseEventHandler } from "react"
import styled, { css } from "styled-components"

import { onSuccess, PromiseExit } from "../data"

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
  const [text, setText] = useState(initialValue)
  const [editing, setEditing] = useState(false)
  const editor = useRef<HTMLInputElement | undefined>(undefined)
  useEffect(() => {
    if (editing) {
      editor?.current?.focus()
    }
  }, [editing])
  useEffect(() => {
    setText(initialValue)
  }, [initialValue])

  const submit = () => onChange(text, () => setEditing(false))

  return editing ? (
    <Field
      multiline={multiline}
      inputRef={editor}
      value={text}
      disabled={loading}
      onKeyPress={multiline ? undefined : (evt) => evt.charCode === 13 && submit()}
      onBlur={submit}
      onChange={(evt) => setText(evt.target.value)}
    />
  ) : (
    <Clickable style={{ display: "inline" }} onClick={() => setEditing(true)}>
      {children}
    </Clickable>
  )
}

export const Field = ({
  onChange,
  state,
  ...rest
}: {
  onChange: (t: NonEmptyString) => PromiseExit
  state?: unknown
} & Omit<TextFieldProps, "onChange">) => {
  const [text, setText] = useState("")
  const clearText = () => setText("")
  useEffect(() => {
    clearText()
  }, [state])

  return (
    <TextField
      value={text}
      onChange={(evt) => setText(evt.target.value)}
      onKeyPress={(evt) => {
        evt.charCode === 13 &&
          text.length &&
          onChange(text as NonEmptyString).then(onSuccess(clearText))
      }}
      {...rest}
    />
  )
}

export function FavoriteButton({
  disabled,
  isFavorite,
  onClick,
}: {
  disabled: boolean
  onClick: (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  isFavorite: boolean
}) {
  return (
    <IconButton disabled={disabled} onClick={onClick}>
      {isFavorite ? <Favorite /> : <FavoriteBorder />}
    </IconButton>
  )
}

export interface ClickableMixinProps<El> {
  onClick?: MouseEventHandler<El>
}

export function ClickableMixin<El>({ onClick }: ClickableMixinProps<El>) {
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
