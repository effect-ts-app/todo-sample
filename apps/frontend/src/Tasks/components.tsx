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
