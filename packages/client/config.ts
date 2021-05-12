import * as T from "@effect-ts/core/Effect"
import { tag } from "@effect-ts/core/Has"
import * as Layer from "@effect-ts/system/Layer"

export interface ApiConfig {
  apiUrl: string
  userProfileHeader?: string
}

export const ApiConfig = tag<ApiConfig>()

export const getConfig = T.accessServiceM(ApiConfig)

export const LiveApiConfig = (config: ApiConfig) =>
  Layer.fromFunction(ApiConfig)(() => config)
