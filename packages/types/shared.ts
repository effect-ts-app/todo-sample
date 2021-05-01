import { constVoid } from "@effect-ts/core/Function"
import * as Sy from "@effect-ts/core/Sync"
import { make, AType, DecoderURI, EncoderURI, opaque } from "@effect-ts/morphic"
import { v4 } from "uuid"

export * from "@effect-ts-demo/core/ext/Model/model.types"

export function makeUuid() {
  return v4() as UUID
}

export const UUID = make((F) => F.uuid())
export type UUID = AType<typeof UUID>

const defaultVoid = Sy.succeed(constVoid())
const defaultVoidThunk = () => defaultVoid
const Void_ = make((F) =>
  F.unknown({
    conf: {
      [DecoderURI]: (codec) => codec.with(defaultVoidThunk),
      [EncoderURI]: () => ({ encode: defaultVoidThunk }),
    },
  })
)
export type Void = void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Void = opaque<Void, Void>()(Void_ as any)
