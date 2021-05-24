import { ParsedShapeOf } from "@effect-ts/schema"
import { reasonableString } from "@effect-ts-app/core/ext/Schema"

export const FileName = reasonableString
export type FileName = ParsedShapeOf<typeof FileName>
