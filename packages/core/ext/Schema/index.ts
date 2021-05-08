import * as S from "@effect-ts/schema"

import { schemaField } from "./vendor"

export const namedC = function (cls: any) {
  cls[schemaField] = cls[schemaField]["|>"](S.named(cls.name))
  return cls
}

export * from "./_api"
export * from "./Request"

export * from "./_schema"
