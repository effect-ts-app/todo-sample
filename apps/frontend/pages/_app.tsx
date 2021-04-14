//import "../styles/globals.css"

import { useRouter } from "next/router"
import React from "react"
import { BrowserRouter, StaticRouter } from "react-router-dom"

import { WithContext } from "../context"

const isServer = !(process as any).browser

function MyApp({ Component, pageProps }: any) {
  const r = useRouter()
  return isServer ? (
    <WithContext>
      <StaticRouter location={r.pathname}>
        <Component {...pageProps} />
      </StaticRouter>
    </WithContext>
  ) : (
    <WithContext>
      <BrowserRouter>
        <Component {...pageProps} />
      </BrowserRouter>
    </WithContext>
  )
}

export default MyApp
