import { useEffect } from "react"

export type WithLoading<Fnc> = Fnc & {
  loading: boolean
}

export function withLoading<Fnc>(fnc: Fnc, loading: boolean): WithLoading<Fnc> {
  return Object.assign(fnc, { loading })
}

export function useReportLoading(name: string) {
  return useEffect(() => {
    console.log("$$$ loaded", name)

    return () => console.log("$$$ unloaded", name)
  }, [])
}
