import { StyledEngineProvider, useMediaQuery } from "@material-ui/core"
import { createMuiTheme, StylesProvider, ThemeProvider } from "@material-ui/core/styles"
import AdapterDateFns from "@material-ui/lab/AdapterDateFns"
import LocalizationProvider from "@material-ui/lab/LocalizationProvider"
import React from "react"

import GlobalStyle from "@/GlobalStyle"
import { LiveFetchContext, LiveServiceContext } from "@/context"

function MyApp({ Component, pageProps }: any) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        // TODO
        // palette: {
        //   mode: prefersDarkMode ? "dark" : "light",
        // },
      }),
    [prefersDarkMode]
  )

  return (
    <StyledEngineProvider injectFirst>
      <StylesProvider injectFirst>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <LiveServiceContext>
              <LiveFetchContext>
                <GlobalStyle />
                <Component {...pageProps} />
              </LiveFetchContext>
            </LiveServiceContext>
          </LocalizationProvider>
        </ThemeProvider>
      </StylesProvider>
    </StyledEngineProvider>
  )
}

export default MyApp
