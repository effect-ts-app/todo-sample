import styled, { css } from "styled-components"

export const Table = styled.table`
  width: 100%;
  tr > td {
    text-align: left;
  }
`

export const CompletableEntry = styled.tr<{ completed: boolean }>`
  ${({ onClick }) =>
    onClick &&
    css`
      cursor: pointer;
    `}
  ${({ completed }) =>
    completed &&
    css`
      text-decoration: line-through;
    `}
`
