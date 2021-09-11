import {
  LongString,
  Model,
  ParsedShapeOf,
  prop,
  ReasonableString,
} from "@effect-ts-app/core/Schema"

export const FileName = ReasonableString
export type FileName = ParsedShapeOf<typeof FileName>

// TODO
export const Url = LongString
export type Url = ParsedShapeOf<typeof Url>

export const MimeType = ReasonableString
export type MimeType = ParsedShapeOf<typeof MimeType>

export class Attachment extends Model<Attachment>()({
  fileName: prop(FileName),
  mimetype: prop(MimeType),
  url: prop(Url),
}) {}
