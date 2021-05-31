import {
  longString,
  Model,
  ParsedShapeOf,
  prop,
  reasonableString,
} from "@effect-ts-app/core/Schema"

export const FileName = reasonableString
export type FileName = ParsedShapeOf<typeof FileName>

// TODO
export const Url = longString
export type Url = ParsedShapeOf<typeof Url>

export const MimeType = reasonableString
export type MimeType = ParsedShapeOf<typeof MimeType>

export class Attachment extends Model<Attachment>()({
  fileName: prop(FileName),
  mimetype: prop(MimeType),
  url: prop(Url),
}) {}
