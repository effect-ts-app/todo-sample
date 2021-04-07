import AdapterDateFns from "@material-ui/lab/AdapterDateFns"
import LocalizationProvider from "@material-ui/lab/LocalizationProvider"
import React from "react"
import ReactDOM from "react-dom"

import App from "./App"
import GlobalStyle from "./GlobalStyle"
import { LiveServiceContext, LiveFetchContext } from "./context"
import reportWebVitals from "./reportWebVitals"

ReactDOM.render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <LiveServiceContext>
        <LiveFetchContext>
          <GlobalStyle />
          <App />
        </LiveFetchContext>
      </LiveServiceContext>
    </LocalizationProvider>
  </React.StrictMode>,
  document.getElementById("root")
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
