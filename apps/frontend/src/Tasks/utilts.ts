export type WithLoading<Fnc> = Fnc & {
  loading: boolean
}

export function withLoading<Fnc>(fnc: Fnc, loading: boolean): WithLoading<Fnc> {
  return Object.assign(fnc, { loading })
}
