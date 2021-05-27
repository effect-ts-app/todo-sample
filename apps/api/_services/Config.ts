import { Has } from "@effect-ts/core"
import * as L from "@effect-ts/core/Effect/Layer"
import * as T from "@effect-ts-app/core/ext/Effect"

import * as cfg from "@/config"

export type Config = typeof cfg
export const Config = Has.tag<Config>()

export const LiveConfig = (cfg: Config) => L.pure(Config)(cfg)
export const config = T.accessService(Config)
export const configM = T.accessServiceM(Config)
