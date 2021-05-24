import { ParsedShapeOf } from "@effect-ts/schema"
import { longString, reasonableString } from "@effect-ts-app/core/ext/Schema"

export const FileName = reasonableString
export type FileName = ParsedShapeOf<typeof FileName>

// TODO
export const Url = longString
export type Url = ParsedShapeOf<typeof Url>
