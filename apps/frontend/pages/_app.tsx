import { StyledEngineProvider } from "@material-ui/core"
import { StylesProvider } from "@material-ui/core/styles"
import AdapterDateFns from "@material-ui/lab/AdapterDateFns"
import LocalizationProvider from "@material-ui/lab/LocalizationProvider"
import React from "react"

import GlobalStyle from "@/GlobalStyle"
import { LiveFetchContext, LiveServiceContext } from "@/context"

function MyApp({ Component, pageProps }: any) {
  return (
    <StyledEngineProvider injectFirst>
      <StylesProvider injectFirst>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <LiveServiceContext>
            <LiveFetchContext>
              <GlobalStyle />
              <Component {...pageProps} />
            </LiveFetchContext>
          </LiveServiceContext>
        </LocalizationProvider>
      </StylesProvider>
    </StyledEngineProvider>
  )
}

export default MyApp
