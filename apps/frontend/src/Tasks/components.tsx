import { TextField, TextFieldProps } from "@material-ui/core"
import React, { useState, createRef, useEffect } from "react"
import styled, { css } from "styled-components"

export const Table = styled.table`
  width: 100%;
  tr > td {
    text-align: left;
  }
`

export const Clickable = styled.div`
  ${({ onClick }) =>
    onClick &&
    css`
      cursor: pointer;
    `}
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
    <Clickable onClick={() => setEditing(true)}>{children}</Clickable>
  )
}
