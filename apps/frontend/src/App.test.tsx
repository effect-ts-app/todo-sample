import { render, screen } from "@testing-library/react"
import React from "react"

import App from "./App"
import { WithContext } from "./context"

test("renders learn react link", () => {
  render(
    <WithContext>
      <App />
    </WithContext>
  )
  const linkElement = screen.getByText(/learn react/i)
  expect(linkElement).toBeInTheDocument()
})
