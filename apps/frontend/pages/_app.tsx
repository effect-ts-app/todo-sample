import React from "react"

import { WithContext } from "@/context"

function MyApp({ Component, pageProps }: any) {
  return (
    <WithContext>
      <Component {...pageProps} />
    </WithContext>
  )
}

export default MyApp
