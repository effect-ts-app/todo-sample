import { ApiConfig } from "@effect-ts-demo/todo-client/config"

const config: ApiConfig = Object.freeze({
  apiUrl: "/api/proxy",
} as ApiConfig)

export function useConfig() {
  return config
}
