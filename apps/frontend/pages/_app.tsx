import { StyledEngineProvider, useMediaQuery } from "@material-ui/core"
import { createMuiTheme, StylesProvider, ThemeProvider } from "@material-ui/core/styles"
import AdapterDateFns from "@material-ui/lab/AdapterDateFns"
import LocalizationProvider from "@material-ui/lab/LocalizationProvider"
import "nprogress/nprogress.css"
import { useRouter } from "next/router"
import NProgress from "nprogress"
import React, { useEffect } from "react"

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

  const router = useRouter()

  useEffect(() => {
    const routeChangeStart = () => NProgress.start()
    const routeChangeComplete = () => NProgress.done()

    router.events.on("routeChangeStart", routeChangeStart)
    router.events.on("routeChangeComplete", routeChangeComplete)
    router.events.on("routeChangeError", routeChangeComplete)
    return () => {
      router.events.off("routeChangeStart", routeChangeStart)
      router.events.off("routeChangeComplete", routeChangeComplete)
      router.events.off("routeChangeError", routeChangeComplete)
    }
  }, [])

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
